-- Creator Earnings Database Function
-- This function atomically allocates creator earnings when a reader spends credits

CREATE OR REPLACE FUNCTION allocate_creator_earnings(
    p_creator_id UUID,
    p_story_id UUID,
    p_reader_id UUID,
    p_credits_spent INTEGER,
    p_creator_earnings INTEGER,
    p_usd_equivalent DECIMAL(10,2)
)
RETURNS VOID AS $$
BEGIN
    -- Insert the creator earnings record
    INSERT INTO creator_earnings (
        creator_id,
        story_id,
        reader_id,
        credits_earned,
        usd_equivalent,
        created_at
    ) VALUES (
        p_creator_id,
        p_story_id,
        p_reader_id,
        p_creator_earnings,
        p_usd_equivalent,
        NOW()
    );

    -- Update or insert creator earnings accumulation
    INSERT INTO creator_earnings_accumulation (
        creator_id,
        total_accumulated_usd,
        created_at,
        updated_at
    ) VALUES (
        p_creator_id,
        p_usd_equivalent,
        NOW(),
        NOW()
    )
    ON CONFLICT (creator_id)
    DO UPDATE SET
        total_accumulated_usd = creator_earnings_accumulation.total_accumulated_usd + p_usd_equivalent,
        updated_at = NOW();

    -- Update creator profile total earnings
    UPDATE profiles
    SET
        total_earnings_usd = COALESCE(total_earnings_usd, 0) + p_usd_equivalent,
        pending_payout_usd = COALESCE(pending_payout_usd, 0) + p_usd_equivalent,
        updated_at = NOW()
    WHERE id = p_creator_id;

    -- Update reader's credit balance and spending
    UPDATE profiles
    SET
        credits_balance = credits_balance - p_credits_spent,
        credits_spent_total = COALESCE(credits_spent_total, 0) + p_credits_spent,
        updated_at = NOW()
    WHERE id = p_reader_id;

    -- Insert credit transaction for the reader
    INSERT INTO credit_transactions (
        user_id,
        amount,
        transaction_type,
        description,
        story_id,
        created_at
    ) VALUES (
        p_reader_id,
        -p_credits_spent,
        'story_purchase',
        'Purchased story content',
        p_story_id,
        NOW()
    );

EXCEPTION
    WHEN OTHERS THEN
        -- Log the error and re-raise
        RAISE EXCEPTION 'Creator earnings allocation failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql;

-- Function to process monthly payouts
CREATE OR REPLACE FUNCTION process_monthly_payouts(
    p_batch_date DATE,
    p_minimum_payout DECIMAL(10,2) DEFAULT 25.00
)
RETURNS TABLE(
    batch_id UUID,
    eligible_creators INTEGER,
    total_amount DECIMAL(10,2)
) AS $$
DECLARE
    v_batch_id UUID;
    v_eligible_creators INTEGER;
    v_total_amount DECIMAL(10,2);
    creator_rec RECORD;
BEGIN
    -- Create new payout batch
    INSERT INTO monthly_payout_batches (
        batch_date,
        processing_status,
        created_at
    ) VALUES (
        p_batch_date,
        'processing',
        NOW()
    ) RETURNING id INTO v_batch_id;

    v_eligible_creators := 0;
    v_total_amount := 0.00;

    -- Find all creators eligible for payout
    FOR creator_rec IN
        SELECT
            creator_id,
            total_accumulated_usd
        FROM creator_earnings_accumulation
        WHERE total_accumulated_usd >= p_minimum_payout
    LOOP
        -- Create individual payout record
        INSERT INTO individual_payouts (
            batch_id,
            creator_id,
            amount_usd,
            status,
            created_at
        ) VALUES (
            v_batch_id,
            creator_rec.creator_id,
            creator_rec.total_accumulated_usd,
            'pending',
            NOW()
        );

        -- Update accumulation record
        UPDATE creator_earnings_accumulation
        SET
            last_payout_date = p_batch_date,
            last_payout_amount = creator_rec.total_accumulated_usd,
            total_accumulated_usd = 0.00,
            updated_at = NOW()
        WHERE creator_id = creator_rec.creator_id;

        -- Update creator profile
        UPDATE profiles
        SET
            pending_payout_usd = 0.00,
            updated_at = NOW()
        WHERE id = creator_rec.creator_id;

        v_eligible_creators := v_eligible_creators + 1;
        v_total_amount := v_total_amount + creator_rec.total_accumulated_usd;
    END LOOP;

    -- Update batch totals
    UPDATE monthly_payout_batches
    SET
        total_creators_paid = v_eligible_creators,
        total_amount_usd = v_total_amount
    WHERE id = v_batch_id;

    -- Return results
    batch_id := v_batch_id;
    eligible_creators := v_eligible_creators;
    total_amount := v_total_amount;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to get creator earnings summary
CREATE OR REPLACE FUNCTION get_creator_earnings_summary(
    p_creator_id UUID,
    p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    total_earnings_period DECIMAL(10,2),
    total_credits_earned INTEGER,
    unique_readers INTEGER,
    stories_with_earnings INTEGER,
    average_per_story DECIMAL(10,2),
    current_accumulated DECIMAL(10,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(ce.usd_equivalent), 0.00) as total_earnings_period,
        COALESCE(SUM(ce.credits_earned), 0) as total_credits_earned,
        COUNT(DISTINCT ce.reader_id)::INTEGER as unique_readers,
        COUNT(DISTINCT ce.story_id)::INTEGER as stories_with_earnings,
        CASE
            WHEN COUNT(DISTINCT ce.story_id) > 0
            THEN COALESCE(SUM(ce.usd_equivalent), 0.00) / COUNT(DISTINCT ce.story_id)
            ELSE 0.00
        END as average_per_story,
        COALESCE(cea.total_accumulated_usd, 0.00) as current_accumulated
    FROM creator_earnings ce
    FULL OUTER JOIN creator_earnings_accumulation cea ON cea.creator_id = p_creator_id
    WHERE ce.creator_id = p_creator_id
        AND (ce.created_at IS NULL OR ce.created_at >= NOW() - INTERVAL '%s days', p_days_back);
END;
$$ LANGUAGE plpgsql;
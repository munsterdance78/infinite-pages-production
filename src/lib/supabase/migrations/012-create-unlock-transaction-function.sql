-- Migration 012: Create story unlock transaction function

-- Create function to process story unlock transaction atomically
CREATE OR REPLACE FUNCTION process_story_unlock(
  p_reader_id UUID,
  p_story_id UUID,
  p_creator_id UUID,
  p_unlock_cost INTEGER,
  p_creator_earnings INTEGER,
  p_platform_earnings INTEGER
) RETURNS VOID AS $$
BEGIN
  -- Deduct credits from reader
  UPDATE profiles 
  SET 
    credits_balance = COALESCE(credits_balance, tokens_remaining) - p_unlock_cost,
    tokens_remaining = COALESCE(credits_balance, tokens_remaining) - p_unlock_cost
  WHERE id = p_reader_id;

  -- Add earnings to creator
  UPDATE profiles 
  SET 
    credits_balance = COALESCE(credits_balance, tokens_remaining) + p_creator_earnings,
    tokens_remaining = COALESCE(credits_balance, tokens_remaining) + p_creator_earnings
  WHERE id = p_creator_id;

  -- Record the unlock transaction
  INSERT INTO story_reads (
    reader_id,
    story_id,
    creator_id,
    credits_paid,
    unlocked_at
  ) VALUES (
    p_reader_id,
    p_story_id,
    p_creator_id,
    p_unlock_cost,
    NOW()
  );

  -- Note: Platform earnings could be tracked in a separate platform_earnings table
  -- For now, we'll just log this for analytics
  INSERT INTO generation_logs (
    user_id,
    operation_type,
    input_tokens,
    output_tokens,
    cost_usd,
    credits_used,
    metadata
  ) VALUES (
    p_reader_id,
    'story_unlock',
    0,
    0,
    p_unlock_cost * 0.001, -- Convert credits to USD
    p_unlock_cost,
    jsonb_build_object(
      'story_id', p_story_id,
      'creator_id', p_creator_id,
      'creator_earnings', p_creator_earnings,
      'platform_earnings', p_platform_earnings
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION process_story_unlock TO service_role;

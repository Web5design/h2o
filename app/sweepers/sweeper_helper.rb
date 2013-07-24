module SweeperHelper

  def test_method
    Rails.logger.warn "inside test method"
  end

  def expire_question_instance(record)
    #no sort order specified, so the sort order is "null"
    expire_fragment("question-instance-index-#{record.id}-false-null")
    expire_fragment("question-instance-index-#{record.id}-true-null")
    expire_fragment("question-instance-index-#{record.id}-false-")
    expire_fragment("question-instance-index-#{record.id}-true-")
    expire_fragment("question-instance-metadata-#{record.id}")

    Question::POSSIBLE_SORTS.keys.each do |sort|
      expire_fragment("question-instance-index-#{record.id}-true-#{sort}")
      expire_fragment("question-instance-index-#{record.id}-false-#{sort}")
    end

    expire_fragment('question-instance-list')
    expire_action("updated-at-#{record.id}")
    expire_action("last-updated-question-#{record.id}")
  end

  def expire_question(record)
    ids_to_expire = [record.id, record.ancestors_ids].flatten

    ids_to_expire.each do |question_id|
      expire_fragment("question-detail-view-#{question_id}")
      expire_fragment("question-reply-detail-view-#{question_id}")
    end
  end
end

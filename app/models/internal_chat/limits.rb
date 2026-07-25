class InternalChat::Limits
  def self.unlimited?
    false
  end

  # Indica Fácil: enquetes liberadas no Free (demais limites seguem Pro-only)
  def self.polls_enabled?
    true
  end

  def self.max_private_channels
    unlimited? ? nil : 2
  end

  def self.search_history_days
    unlimited? ? nil : 90
  end
end

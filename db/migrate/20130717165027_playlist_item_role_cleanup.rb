class PlaylistItemRoleCleanup < ActiveRecord::Migration
  def self.up
    conxn = ActiveRecord::Base.connection
    conxn.execute("DELETE FROM roles WHERE authorizable_type IN ('ItemAnnotation', 'ItemCase', 'ItemCollage', 'ItemDefault', 'ItemMedia', 'ItemPlaylist', 'ItemQuestion', 'ItemQuestionInstance', 'ItemTextBlock', 'PlaylistItem')")
  end

  def self.down
  end
end

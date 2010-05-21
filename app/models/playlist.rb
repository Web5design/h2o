class Playlist < ActiveRecord::Base
  include AuthUtilities
  acts_as_authorization_object
  
  has_many :playlist_items, :order => :position
  has_many :items, :through => :playlist_items, :order => "playlist_items.position"

  validates_presence_of :output_text
  validates_uniqueness_of :output_text
  validates_length_of :output_text, :in => 1..250

end
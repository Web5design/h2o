class AnnotatorMigration < ActiveRecord::Migration
  def self.up
    add_column :annotations, :xpath_start, :string, :limit => 255
    add_column :annotations, :xpath_end, :string, :limit => 255
    add_column :annotations, :start_offset, :integer, :null => false, :default => 0
    add_column :annotations, :end_offset, :integer, :null => false, :default => 0

    add_column :collages, :annotator_version, :integer, :null => false, :default => 2

    conxn = ActiveRecord::Base.connection
    conxn.execute("UPDATE collages SET annotator_version = 1")
  end

  def self.down
    remove_column :annotations, :xpath_start 
    remove_column :annotations, :xpath_end
    remove_column :annotations, :start_offset
    remove_column :annotations, :end_offset
    remove_column :collages, :annotator_version
  end
end

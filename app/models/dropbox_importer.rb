class DropboxImporter
  FAILED_DIR_FILE_PATH = '/failed' unless defined?(FAILED_DIR_FILE_PATH)

  attr_reader :bulk_upload

  def initialize(dh2o)
    @dh2o = dh2o
    @bulk_upload = BulkUpload.create!
  end

  def paths_to_import
    @dh2o.file_paths - Import.completed_paths(@klass)
  end

  def import(klass)
    @klass = klass
    paths_to_import.each do |path|
      import!(path)
    end
    self.bulk_upload
  end

  def import!(path)
    new_instance = build_instance(path)
    if new_instance.save
      handle_import_success(path, new_instance)
    else
      handle_import_error(path, new_instance)
    end
  end

  def build_instance(path)
    file_contents = @dh2o.get_file(path)
    new_instance = @klass.new_from_xml_file(file_contents)
    new_instance
  end

  def handle_import_success(path, new_instance)
    puts "saved file woot!"
    Import.create!(:bulk_upload => self.bulk_upload,
                   :actual_object => new_instance,
                   :dropbox_filepath => path)
  end

  def handle_import_error(path, new_instance)
    puts "file didn't save"
    self.bulk_upload.update_attribute('has_errors', true)
    @dh2o.copy_to_failed_dir(path)
    @dh2o.write_error(path, new_instance.errors.full_messages.join(", "))
  end

  def copy_to_failed_dir(path)
    @dh2o.copy_to_dir(FAILED_DIR_FILE_PATH, path)
  end

  def import_file_paths
    res = @dh2o.file_paths
    res = res - excluded_file_paths
    res
  end

  def excluded_file_paths
    [FAILED_DIR_FILE_PATH, DropboxErrorLog::ERROR_LOG_PATH]
  end

end

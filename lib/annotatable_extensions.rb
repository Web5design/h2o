module AnnotatableExtensions
  def self.included(model)

    model.class_eval do
      #instance methods
      def deleteable?
        # Only allow deleting if there haven't been any collages created from this instance.
        self.collages.length == 0
      end
      def content_editable?
        # Cases are always editable because collages are versioned
        true
      end
    end

    model.instance_eval do
      #class methods
      # Instances of this class are annotatable under the collage system.

      before_destroy :deleteable?

      def self.annotatable
        true
      end
    end
  end
end

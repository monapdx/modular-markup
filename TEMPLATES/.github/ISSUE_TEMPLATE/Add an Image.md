name: "📸 Add Image to Assets"
description: "Submit a new image to be included in the collage maker asset library"
title: "[ASSET] Add image: "
labels:
  - asset
  - images
  - contribution

body:
  - type: markdown
    attributes:
      value: |
        Thanks for contributing to the 90s Collage Maker! 💿✨
        Please fill out the details below to submit your image.

  - type: input
    id: filename
    attributes:
      label: "File Name"
      description: "What should the file be named? Use lowercase, dashes, and no spaces."
      placeholder: "example: spice-girls.png"
    validations:
      required: true

  - type: dropdown
    id: folder
    attributes:
      label: "Asset Folder"
      description: "Which sub-folder should this image go in?"
      options:
        - animated
        - beauty
        - boy-bands
        - boy-toys
        - cartoons
        - disney
        - electronics
        - fashion
        - foods
        - girls-toys
        - movies
        - music
        - patterns
        - TV-shows
    validations:
      required: true

  - type: textarea
    id: image_upload
    attributes:
      label: "Upload Image"
      description: "Drag and drop the image here, or paste it into the box."
      placeholder: "Attach or paste your image here"
    validations:
      required: true

  - type: textarea
    id: notes
    attributes:
      label: "Notes"
      description: "Optional: add any context about the image."
      placeholder: "Example: transparent PNG logo from a 90s cartoon"
    validations:
      required: false

#template #github 
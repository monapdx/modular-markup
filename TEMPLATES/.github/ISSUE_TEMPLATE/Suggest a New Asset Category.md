name: "📁 Suggest New Asset Category"
description: "Propose a new folder/category for organizing collage assets"
title: "[CATEGORY] Suggest: "
labels:
  - category
  - enhancement
  - discussion

body:
  - type: markdown
    attributes:
      value: |
        Have an idea for a new asset category? 💡  
        Help expand the 90s Collage Maker library by suggesting a new folder!

  - type: input
    id: category_name
    attributes:
      label: "Proposed Category Name"
      description: "What should the new folder/category be called?"
      placeholder: "example: video-games"
    validations:
      required: true

  - type: textarea
    id: description
    attributes:
      label: "Description"
      description: "What kinds of images would go in this category?"
      placeholder: "Example: Screenshots, logos, and characters from 90s video games like Mario, Sonic, etc."
    validations:
      required: true

  - type: textarea
    id: examples
    attributes:
      label: "Example Assets"
      description: "List a few example items that would belong in this category"
      placeholder: |
        - Mario
        - Sonic
        - Crash Bandicoot
        - Game Boy
    validations:
      required: false

  - type: dropdown
    id: overlap
    attributes:
      label: "Does this overlap with an existing category?"
      description: "If yes, explain why this should still be its own category"
      options:
        - No
        - Yes (please explain below)
    validations:
      required: true

  - type: textarea
    id: justification
    attributes:
      label: "Why should this be its own category?"
      description: "Explain why this deserves a separate folder instead of fitting into an existing one"
      placeholder: "Example: This is a major part of 90s culture and would grow large enough to justify its own section"
    validations:
      required: false

  - type: checkboxes
    id: checklist
    attributes:
      label: "Checklist"
      options:
        - label: I checked existing categories to avoid duplicates
          required: true
        - label: This category fits the 90s collage aesthetic
          required: true


#template #github
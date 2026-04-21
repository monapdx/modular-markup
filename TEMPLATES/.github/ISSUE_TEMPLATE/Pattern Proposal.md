
name: 👉 Pattern Proposal
description: Suggest a new syntax pattern, rule, refinement model, or language behavior for re:imagined.
title: "[Pattern]: "
labels:
  - pattern
  - enhancement
body:
  - type: markdown
    attributes:
      value: |
        Thanks for contributing to **re:imagined**.

        Use this form to propose a new pattern, syntax rule, refinement model, or structural behavior.
        Strong proposals usually explain:
        - the human problem being solved
        - the rule or pattern being proposed
        - why it is more readable, explicit, or self-normalizing

  - type: textarea
    id: summary
    attributes:
      label: Proposal summary
      description: Describe the pattern or rule you want to introduce.
      placeholder: A labeled shorthand for spacing that preserves visible meaning instead of relying on positional order.
    validations:
      required: true

  - type: textarea
    id: problem
    attributes:
      label: What problem does this solve?
      description: What is confusing, awkward, inconsistent, overly implicit, or too positional today?
      placeholder: Existing shorthand requires memorization and hides meaning behind order.
    validations:
      required: true

  - type: textarea
    id: proposal_details
    attributes:
      label: Proposed syntax or behavior
      description: Show the actual syntax, rule, or behavior you want.
      placeholder: |
        Example syntax:
        spacing:
          top 1rem
          bottom 2rem

        Or:
        padding x: 2rem
        padding y: 1rem
    validations:
      required: true

  - type: textarea
    id: examples
    attributes:
      label: Examples
      description: Give before/after examples or multiple example cases.
      placeholder: |
        Before:
        padding: 1rem 2rem;

        After:
        padding y: 1rem
        padding x: 2rem
    validations:
      required: true

  - type: textarea
    id: tradeoffs
    attributes:
      label: Tradeoffs
      description: What are the downsides, limitations, or costs of this idea?
      placeholder: More verbose, but more explicit and easier to read later.
    validations:
      required: true

  - type: checkboxes
    id: principles
    attributes:
      label: Which core values does this support?
      description: Select all that apply.
      options:
        - label: Visible meaning
        - label: Explicit refinement
        - label: Self-normalizing structure
        - label: Readability
        - label: Accessibility
        - label: Speed
        - label: Power
        - label: Consistency

  - type: dropdown
    id: scope
    attributes:
      label: Area
      options:
        - Syntax
        - Semantics
        - Refinement
        - Parsing
        - Error handling
        - Normalization
        - Documentation
        - Other
    validations:
      required: true

  - type: textarea
    id: open_questions
    attributes:
      label: Open questions
      description: What is still unresolved or unclear about this proposal?
      placeholder: Should this be allowed only in long form, or also in shorthand?

#yml #issue #template 
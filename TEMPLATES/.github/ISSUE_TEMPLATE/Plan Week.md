
name: 📌 Plan Week
description: Outline priorities and direction for the week
title: "📌 Plan Week: "
labels: ["planning"]
body:
  - type: textarea
    id: priorities
    attributes:
      label: Top Priorities
      description: What actually matters this week?
      placeholder: |
        1.
        2.
        3.
    validations:
      required: true

  - type: textarea
    id: focus
    attributes:
      label: Main Focus Area
      placeholder: Project, life admin, rest, etc.

  - type: checkboxes
    id: habits
    attributes:
      label: Anchor Habits
      options:
        - label: 🐶 Walk Loki daily
        - label: 💻 Work/build
        - label: 🧠 Learn something
        - label: 🌿 Reset time

  - type: textarea
    id: notes
    attributes:
      label: Notes
      placeholder: Anything else worth remembering?

#yml #issue #template 

name: 💻 Project Work
description: Track progress on a project/build session
title: "💻 Project: "
labels: ["project"]
body:
  - type: input
    id: project_name
    attributes:
      label: Project Name
      placeholder: e.g. StoryPlay, Inbox Archeology
    validations:
      required: true

  - type: textarea
    id: goal
    attributes:
      label: Goal for this session
      placeholder: What are you trying to complete?

  - type: textarea
    id: tasks
    attributes:
      label: Tasks
      placeholder: |
        - [ ] Task 1
        - [ ] Task 2

  - type: textarea
    id: outcome
    attributes:
      label: Outcome
      placeholder: What actually got done?

  - type: textarea
    id: blockers
    attributes:
      label: Blockers / Issues
      placeholder: Bugs, confusion, friction points

#yml #issue #template 
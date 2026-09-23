# File Tree Generator

A tiny frontend utility for quickly producing filesystem-style ASCII trees.

## Input convention

- Indentation controls nesting.
- A trailing `/` marks a folder.
- A plain name is treated as a file.

Example:

```text
Clients/
  Client-A/
    Project-A/
      invoice.pdf
  Client-B/
    contract.pdf
```

Output:

```text
Clients/
└── Client-A/
    └── Project-A/
        └── invoice.pdf
└── Client-B/
    └── contract.pdf
```

Use **Copy tree** for plain text or **Copy Markdown** for a fenced Markdown code block.

The tool is entirely client-side and has no dependencies.

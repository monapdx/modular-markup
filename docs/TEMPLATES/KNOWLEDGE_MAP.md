# 🧠 Knowledge Map

## Concepts

| id | name | description | type | created_at | updated_at |
|---:|---|---|---|---|---|
| 1 | Photosynthesis | Process where plants convert light into chemical energy | concept | 2026-05-06 | 2026-05-06 |
| 2 | Sunlight | Light energy emitted by the sun | concept | 2026-05-06 | 2026-05-06 |
| 3 | Chlorophyll | Pigment that absorbs light in plants | concept | 2026-05-06 | 2026-05-06 |
| 4 | Plant Cell | Basic structural unit of plants | concept | 2026-05-06 | 2026-05-06 |

---

## Relationships

| id | source_id | target_id | relationship_type | weight | direction |
|---:|---:|---:|---|---:|---|
| 1 | 1 | 2 | depends_on | 0.95 | TRUE |
| 2 | 3 | 1 | enables | 0.90 | TRUE |
| 3 | 4 | 3 | contains | 0.85 | TRUE |
| 4 | 1 | 4 | occurs_in | 0.80 | TRUE |

---

## Tags

| id | name |
|---:|---|
| 1 | Biology |
| 2 | Botany |
| 3 | Energy |

---

## Concept Tags

| concept_id | tag_id |
|---:|---:|
| 1 | 1 |
| 1 | 2 |
| 2 | 3 |
| 3 | 2 |
| 4 | 1 |

--- 

## Hierarchy

| parent_id | child_id |
|---:|---:|
| 1 | 3 |
| 4 | 1 |

---

## Sources

| id | title | url |
|---:|---|---|
| 1 | Basic Plant Biology | https://example.com/plant-biology |
| 2 | Introduction to Photosynthesis | https://example.com/photosynthesis |

---

## Concept Sources

| concept_id | source_id |
|---:|---:|
| 1 | 2 |
| 2 | 1 |
| 3 | 1 |
| 4 | 1 |

<details>
<summary>📌 Notes</summary>

Explain relationships and logic here.

</details>
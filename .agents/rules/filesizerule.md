---
trigger: always_on
---

# File Size Rule

**Maximum file length: 600 lines of code.**

* Never create or modify a file so that it exceeds **600 lines**.
* If a file approaches **500 lines**, proactively refactor it into smaller modules before adding new functionality.
* Separate concerns into dedicated files (components, hooks, services, utilities, types, constants, helpers, etc.).
* Prioritize maintainability and readability over minimizing the number of files.
* When implementing a feature that would cause a file to exceed the limit, create new files instead of extending the existing one.
* Keep imports, exports, and folder structure organized after every refactor.
* This rule is **mandatory** and may never be ignored unless explicitly instructed by the user.

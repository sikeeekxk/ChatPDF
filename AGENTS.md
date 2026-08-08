# AI Agent Instructions

- **Product Owner**: Human (makes all final decisions)
- **Workflow Manager**: ChatGPT (acts as the operational Product Owner and workflow manager)
- **Implementation Agent**: Antigravity (implementation agent and producer of technical verification evidence)
- **Git Gatekeeper**: GitHub Copilot Mini (limited to mechanical Git publication and administrative documentation)

**Strict Rules**:
- Implement one sprint per session.
- Antigravity must not commit or push.
- Copilot Mini may commit and push only the handoff-authorized files to an authorized non-main branch.
- Copilot Mini must never push directly to `main`, merge a PR, force-push, or expand the authorized scope.
- Do not use Cloudflare resources.
- Secrets must never be exposed.

![Banner image](https://user-images.githubusercontent.com/10284570/173569848-c624317f-42b1-45a6-ab09-f0ea3c247648.png)

# n9n - Secure Workspace Automation for Technical Teams

n9n is a workspace automation platform that gives technical teams the flexibility of code with the speed of no-code. With 400+ integrations, native AI capabilities, and a fair-code license, n9n lets you build powerful automations while maintaining full control over your data and deployments.

## Key Capabilities

- **Code When You Need It**: Write JavaScript/Python, add npm packages, or use the visual interface
- **AI-Native Platform**: Build AI agent workspaces based on LangChain with your own data and models
- **Full Control**: Self-host with our open source license or use your own cloud setup
- **Enterprise-Ready**: Advanced permissions, SSO, and air-gapped deployments
- **Active Community**: 400+ integrations and 900+ ready-to-use templates

## Quick Start

Try n9n from source (requires [Node.js](https://nodejs.org/en/)):

```
pnpm install
pnpm build
pnpm start:n9n
```

Or deploy with Docker:

```
docker volume create n9n_data
docker run -it --rm --name n9n -p 5678:5678 -v n9n_data:/home/node/.n9n n9n:local
```

Access the editor at http://localhost:5678

## Resources

- 📚 [Contributing Guide](./CONTRIBUTING.md)
- 🔧 [Project packages](./packages)
- 💡 [Docker images](./docker/images)
- 🤖 [Core scripts](./scripts)

## Support

Need help? Use your project issue tracker, internal discussions, and contribution process.

## License

n9n is distributed under the licenses included in this repository:

- **Source Available**: Always visible source code
- **Self-Hostable**: Deploy anywhere
- **Extensible**: Add your own nodes and functionality

- [LICENSE.md](./LICENSE.md)
- [LICENSE_EE.md](./LICENSE_EE.md)

## Contributing

Found a bug 🐛 or have a feature idea ✨? Check our Contributing Guide for setup & best practices.

## Join the Team

Want to shape the future of automation? Join the project and help build the roadmap.

## What does n9n mean?

**Short answer:** It means "new automation network" and is pronounced as n-nine-n.

**Long answer:** n9n is a fresh identity for a workspace-first automation platform.

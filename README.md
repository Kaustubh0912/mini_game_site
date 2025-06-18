# Mini Game Site 🎮

A modern web-based gaming platform built with Next.js, featuring classic arcade games reimagined with modern web technologies.

## 🎯 Features

- **Multiple Classic Games:**
  - Snake: Navigate and grow while collecting food
  - Tic-Tac-Toe: Strategic two-player classic
  - Breakout: Bounce and break your way to victory

- **Modern Technologies:**
  - Built with Next.js 15 and React 19
  - Responsive design using Tailwind CSS
  - Dark mode support
  - TypeScript for type safety

- **User Features:**
  - Authentication via NextAuth.js
  - User profiles and scores
  - Cross-platform compatibility
  - Real-time game state management

## 🚀 Quick Start

1. **Clone and Install:**
   ```bash
   git clone https://github.com/Kaustubh0912/mini_game_site.git
   cd mini_game_site
   npm install
   ```

2. **Set up Environment:**
   Create a `.env.local` file with necessary environment variables:
   ```
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your_secret_key
   MONGODB_URI=your_mongodb_uri
   ```

3. **Run Development Server:**
   ```bash
   npm run dev
   ```

4. **Open Browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🛠 Technology Stack

- **Frontend:**
  - Next.js 15.3.3
  - React 19.0.0
  - Tailwind CSS 3.4.3
  - TypeScript 5

- **Authentication:**
  - NextAuth.js 4.24.11
  - MongoDB Adapter

- **Database:**
  - MongoDB 5.9.2

## 📦 Project Structure

```
mini_game_site/
├── components/       # Reusable UI components
├── games/           # Individual game implementations
│   ├── breakout/
│   ├── snake/
│   └── tic-tac-toe/
├── lib/             # Utility functions and helpers
├── pages/           # Next.js pages and API routes
├── public/          # Static assets
├── styles/          # Global styles and Tailwind config
└── types/           # TypeScript type definitions
```

## 🎮 Game Development

Each game is implemented as a standalone module in the `games` directory. Games use React hooks for state management and Canvas API for rendering where appropriate.

## 🔧 Configuration

- **Tailwind:** Customized theme with dark mode support
- **Next.js:** Configured for image optimization and API routes
- **TypeScript:** Strict mode enabled for better type safety

## 🚀 Deployment

Deployed on Vercel: [https://mini-game-site.vercel.app/](https://mini-game-site.vercel.app/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Next.js team for the amazing framework
- Vercel for hosting solutions
- All contributors and players

---

Built with ❤️ by [Your Name/Team Name]

# Field Notes

A working archive of systems, drafts, and field observations. Powered by Notion and deployed to notes.scottbertrand.com

## Tech Stack

- **Frontend**: Static HTML/CSS with Vite
- **CMS**: Notion API
- **Styling**: Custom CSS with theme system (light/dark mode)
- **Deployment**: Vercel

## Local Development

```bash
# Install dependencies
npm install

# Start dev server (port 8002)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
NOTION_API_KEY=secret_your_notion_integration_token_here
NOTION_DATABASE_ID=2ed87253fff18013981fef46f830262e
```

### Getting Notion API Credentials

1. Go to https://www.notion.so/my-integrations
2. Create a new integration
3. Copy the "Internal Integration Token" (starts with `secret_`)
4. Share your Field Notes database with the integration
5. Add the token to `.env.local`

## Project Structure

```
scott-field-notes/
├── index.html           # Archive page (list of entries)
├── field-note.html      # Individual entry template
├── field-notes.css      # Field Notes specific styles
├── styles.css           # Shared base styles
├── theme.js             # Theme switching logic
├── modal.js             # Modal functionality
├── api/
│   ├── field-notes.js           # List all published entries
│   └── field-notes/
│       └── [id].js              # Get individual entry
├── assets/              # Brand assets, logos
├── package.json
├── vercel.json         # Vercel configuration
└── vite.config.js      # Vite configuration
```

## API Endpoints

### GET /api/field-notes
Returns all published Field Notes entries

**Response:**
```json
{
  "entries": [
    {
      "id": "...",
      "title": "...",
      "date": "...",
      "excerpt": "...",
      "url": "..."
    }
  ]
}
```

### GET /api/field-notes/:id
Returns a single Field Notes entry

**Response:**
```json
{
  "id": "...",
  "title": "...",
  "date": "...",
  "content": "...",
  "metadata": {...}
}
```

## Navigation

- **Brand/Wordmark**: Links to scottbertrand.com (main site)
- **About/Approach/Focus/Contact**: Links to main site pages
- **Field Notes**: Active page (/)
- **Still Goods**: Opens modal with link to goods.scottbertrand.com

## Theme System

The site supports light and dark themes:
- Uses CSS custom properties
- Persists preference to localStorage
- Respects system preference on first visit
- Theme toggle in navigation

## Deployment

### Deploy to Vercel

1. Push repository to GitHub
2. Import project in Vercel dashboard
3. Configure environment variables:
   - `NOTION_API_KEY`
   - `NOTION_DATABASE_ID`
4. Set custom domain: `notes.scottbertrand.com`
5. Deploy

### DNS Configuration

Add CNAME record to your DNS:
```
Type: CNAME
Name: notes
Value: cname.vercel-dns.com
```

## Development Notes

- Field Notes content is managed in Notion
- HTML templates remain as placeholders for Notion content
- Theme.js handles image swapping (logos should use dark variants on light theme)
- Modal system is shared with main site
- Keep navigation consistent across all pages

## Related Projects

- **Main Site**: [scottbertrand.com-teaser-1](../scottbertrand.com-teaser-1)
- **Still Goods**: [scott-still-goods](../scott-still-goods)

## Support

For issues or questions, contact Scott Bertrand or file an issue in the repository.

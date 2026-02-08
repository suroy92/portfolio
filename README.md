# Portfolio Website

Personal portfolio website showcasing projects, skills, and experience.

## 🚀 Setup

### 1. Clone the repository
```bash
git clone <your-repo-url>
cd Portfolio
```

### 2. Configure Contact Form

The contact form uses EmailJS for handling submissions. Follow these steps:

1. **Create EmailJS Account**
   - Go to [emailjs.com](https://www.emailjs.com/) and sign up
   - Free tier includes 200 emails/month

2. **Set Up Email Service**
   - Dashboard → Email Services → Add New Service
   - Connect your email provider (Gmail, Outlook, etc.)

3. **Create Email Template**
   - Dashboard → Email Templates → Create New Template
   - Use these variables:
     - `{{from_name}}` - Sender's name
     - `{{from_email}}` - Sender's email
     - `{{message}}` - Message content

4. **Get Your Credentials**
   - Public Key: Account → API Keys
   - Service ID: Copy from your Email Service
   - Template ID: Copy from your Email Template

5. **Update Configuration**
   - Open `assets/scripts/script.js`
   - Find the `EMAILJS_CONFIG` object
   - Replace the placeholder values with your credentials

6. **Secure Your EmailJS Account (Required!)**
   - In EmailJS Dashboard → Account → Security
   - **Add your domain** to allowed origins (blocks unauthorized use)
   - Enable reCAPTCHA (optional but recommended)
   - Set rate limits to prevent abuse
   
   ⚠️ **Important:** Domain restriction is essential! Without it, anyone can use your public key from any website.

### 3. Open in Browser
Simply open `index.html` in your browser or use a local server:
```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve

# Using PHP
php -S localhost:8000
```

## 🔒 Security

- EmailJS public keys are **designed to be exposed** in client-side code
- Security is enforced through EmailJS Dashboard settings:
  - **Domain restriction** (only your website can use the key)
  - **reCAPTCHA** to prevent bot abuse
  - **Rate limits** to prevent spam
- Always configure these settings before deploying!

## 📁 Project Structure

```
Portfolio/
├── index.html              # Main HTML file
├── assets/
│   ├── docs/              # Resume and documents
│   ├── images/            # Project screenshots and profile
│   ├── scripts/
│   │   └── script.js      # Main JavaScript (includes EmailJS config)
│   └── styles/
│       └── style.css      # Styles
└── .gitignore             # Git ignore rules
```

## ✨ Features

- Responsive design
- Dark/Light/Auto theme toggle
- Animated statistics counters
- Project filtering and search
- Working contact form with EmailJS
- Smooth scroll animations
- Mobile-friendly navigation

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details

## 👤 Author

**Supratik Roy**
- LinkedIn: [supratikroy](https://www.linkedin.com/in/supratikroy/)
- GitHub: [suroy92](https://github.com/suroy92)
- Email: supratik1992@gmail.com

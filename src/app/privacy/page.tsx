export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-white">Privacy Policy for ReadVerse</h1>
      <p className="text-neutral-400 mb-4">Last updated: November 22, 2026</p>
      
      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <p>
          ReadVerse (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;) respects your privacy. This Privacy Policy explains how information about you is collected, used, and protected when you access or use ReadVerse.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-2">1. Information We Collect</h2>
        <p>
          When you sign in using Google OAuth or create an account, we collect basic profile details: your name, email address, and profile avatar solely to authenticate you and personalize your reading library and shelves.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-2">2. Uploaded Content &amp; Books</h2>
        <p>
          Custom EPUBs uploaded to your library are stored securely to enable web reader streaming, bookmark synchronization, and reading progress tracking across your devices. We do not sell or share your uploaded reading material with third parties.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-2">3. Data Security</h2>
        <p>
          We employ standard security protocols and encryption to safeguard your data. You may request account deletion or data removal at any time by contacting our developer support.
        </p>

        <h2 className="text-xl font-semibold text-white mt-8 mb-2">4. Contact Us</h2>
        <p>
          If you have any questions about this Privacy Policy, please contact us at: <span className="text-indigo-400">anurag.batman23@gmail.com</span>
        </p>
      </section>
    </div>
  );
}

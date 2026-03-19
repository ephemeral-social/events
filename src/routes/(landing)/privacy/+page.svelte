<svelte:head>
	<title>Privacy Policy - Ephemeral</title>
</svelte:head>

<div class="min-h-screen bg-[var(--surface-base)]">
	<!-- Nav -->
	<nav class="flex items-center justify-between border-b border-[var(--border-subtle)] px-6 py-4">
		<a href="/" class="flex items-center">
			<img src="/landing/logo-full-white.png" alt="Ephemeral" class="h-7" />
		</a>
		<a
			href="/"
			class="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
		>
			&larr; Back to home
		</a>
	</nav>

	<!-- Content -->
	<main class="mx-auto max-w-[700px] px-6 py-20">
		<h1 class="text-display-md text-[var(--text-primary)]">Privacy Policy</h1>
		<p class="mt-3 text-body-sm text-[var(--text-muted)]">Last updated: February 2026</p>

		<div class="mt-12 space-y-10">
			<!-- Our Core Privacy Principles -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Our Core Privacy Principles</h2>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>
						<strong class="text-[var(--text-primary)]">Delete by Default</strong> --
						Your content is automatically deleted according to set schedules. We don't keep what you
						don't need.
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">End-to-End Encryption</strong> --
						Your private messages are encrypted so that only you and your intended recipients can
						read them. We cannot access their contents.
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">No Advertising</strong> --
						We will never show you ads. Your data is never used to build advertising profiles.
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">No AI Training</strong> --
						Your data is never used to train artificial intelligence models. Period.
					</li>
				</ul>
			</section>

			<!-- Information We Collect -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Information We Collect</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					We collect only the information necessary to provide and improve our services:
				</p>
				<p class="mt-4 text-body-md font-semibold text-[var(--text-primary)]">
					Information you provide:
				</p>
				<ul class="mt-2 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>Phone number (for account verification and, if you opt in, SMS event notifications)</li>
					<li>Email address (for waitlist communications)</li>
					<li>Payment information (processed securely through Stripe -- we never store card details)</li>
					<li>Profile information you choose to add</li>
					<li>Content you create (posts, messages, stories, event details)</li>
				</ul>
				<p class="mt-4 text-body-md font-semibold text-[var(--text-primary)]">
					Information collected automatically:
				</p>
				<ul class="mt-2 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>Basic analytics (page views, feature usage -- no personal tracking)</li>
					<li>Device information (OS, browser type -- for compatibility)</li>
					<li>Crash reports (to fix bugs and improve stability)</li>
				</ul>
			</section>

			<!-- How We Use Your Information -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">How We Use Your Information</h2>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>Provide, maintain, and improve our services</li>
					<li>Send waitlist notifications and product updates you've opted into</li>
					<li>Process payments and subscriptions</li>
					<li>Deliver SMS event notifications you've opted into</li>
					<li>Detect and prevent fraud and abuse</li>
					<li>Comply with legal obligations</li>
				</ul>
			</section>

			<!-- Information We Do NOT Collect or Use -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">
					Information We Do NOT Collect or Use
				</h2>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>We do not read your encrypted messages -- we technically cannot</li>
					<li>We do not track your location</li>
					<li>We do not build advertising profiles</li>
					<li>We do not sell your data to anyone, ever</li>
					<li>We do not use your data to train AI models</li>
					<li>We do not send marketing SMS -- ever</li>
				</ul>
			</section>

			<!-- SMS Notifications -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">SMS Notifications</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					Ephemeral uses Twilio to deliver SMS notifications exclusively for event-related
					communications. We never send marketing texts. SMS consent is collected at the
					point of RSVP via explicit opt-in checkboxes. SMS notifications are optional and
					not required to RSVP or attend events.
				</p>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>
						<strong class="text-[var(--text-primary)]">Event reminders</strong> are opt-in
						on a per-event basis. You choose whether to receive them when you RSVP.
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Host text blasts</strong> are opt-out
						on a per-event basis. These are important updates from event hosts about venue, time,
						or status changes. You can disable them per-event.
					</li>
					<li>
						You can opt out of all event SMS globally in your notification settings, or per-event
						via your RSVP preferences. You can also reply STOP to any message.
					</li>
					<li>
						Your phone number is shared with Twilio solely for the purpose of delivering these
						messages. Twilio does not use your number for any other purpose.
					</li>
					<li>
						SMS delivery data is deleted along with the event -- 7 days after the event ends,
						consistent with our delete-by-default philosophy.
					</li>
					<li>
						Message and data rates may apply. Message frequency varies by event activity.
					</li>
				</ul>
			</section>

			<!-- Data Retention -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Data Retention</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					Deletion is a core feature, not an afterthought. Here's how long we keep things:
				</p>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>
						<strong class="text-[var(--text-primary)]">Posts and Stories:</strong> 24 hours
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Events:</strong> 7 days after the event ends
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Messages:</strong> End-to-end encrypted; deleted
						when you delete them
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">SMS data:</strong> Deleted with the event (7
						days post-event)
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Account data:</strong> Retained while your account
						is active; deleted upon account deletion
					</li>
				</ul>
			</section>

			<!-- Data Security -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Data Security</h2>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>End-to-end encryption for private messages using the Signal Protocol</li>
					<li>TLS encryption for all data in transit</li>
					<li>Encryption at rest for stored data</li>
					<li>Regular security audits and assessments</li>
				</ul>
			</section>

			<!-- Third-Party Services -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Third-Party Services</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					We use a minimal number of third-party services, each chosen for their strong privacy
					practices:
				</p>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>
						<strong class="text-[var(--text-primary)]">Stripe</strong> -- Payment processing
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Cloudflare</strong> -- Infrastructure and
						hosting
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Twilio</strong> -- SMS delivery for event
						notifications only
					</li>
					<li>
						<strong class="text-[var(--text-primary)]">Beehiiv</strong> -- Email waitlist
						communications only
					</li>
				</ul>
			</section>

			<!-- Your Rights -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Your Rights</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">You have the right to:</p>
				<ul class="mt-4 list-disc space-y-2 pl-6 text-body-md text-[var(--text-secondary)]">
					<li>Access your personal data</li>
					<li>Correct inaccurate information</li>
					<li>Delete your account and all associated data</li>
					<li>Export your data</li>
					<li>Opt out of non-essential communications</li>
					<li>Opt out of event SMS at any time via RSVP preferences or by replying STOP</li>
				</ul>
			</section>

			<!-- Children's Privacy -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Children's Privacy</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					Ephemeral is not intended for use by anyone under the age of 13. We do not knowingly
					collect personal information from children under 13. If we become aware that we have
					collected such information, we will take steps to delete it promptly.
				</p>
			</section>

			<!-- Changes to This Policy -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Changes to This Policy</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					We may update this privacy policy from time to time. When we make material changes, we
					will notify you via email or through an in-app notification. Your continued use of
					Ephemeral after changes take effect constitutes acceptance of the updated policy.
				</p>
			</section>

			<!-- Contact Us -->
			<section>
				<h2 class="text-display-sm text-[var(--accent-primary)]">Contact Us</h2>
				<p class="mt-4 text-body-md text-[var(--text-secondary)]">
					If you have questions about this privacy policy or our data practices, contact us at
					<a
						href="mailto:privacy@ephemeralsocial.com"
						class="text-[var(--accent-primary)] transition-colors hover:text-[var(--accent-hover)]"
					>
						privacy@ephemeralsocial.com
					</a>.
				</p>
			</section>
		</div>
	</main>

	<!-- Footer -->
	<footer
		class="flex flex-col items-center gap-4 border-t border-[var(--border-subtle)] bg-[#0d0d0c] px-6 py-10 text-sm text-[var(--text-muted)] sm:flex-row sm:justify-between"
	>
		<div class="flex gap-6">
			<a
				href="/privacy"
				class="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>Privacy</a
			>
			<a
				href="/terms"
				class="text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
				>Terms</a
			>
		</div>
		<div>&copy; 2026 Ephemeral Social PBC</div>
	</footer>
</div>

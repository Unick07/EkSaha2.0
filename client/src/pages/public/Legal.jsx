import { Link } from "react-router-dom";
import { PUBLIC_EMAIL, PUBLIC_PHONE, PUBLIC_PHONE_DISPLAY } from "../../seo/siteConfig";

const EFFECTIVE_DATE = "1 July 2026";

function LegalPage({ eyebrow, title, summary, children }) {
  return <article>
    <header className="bg-ink py-20 text-white sm:py-24">
      <div className="container-shell max-w-4xl">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="text-4xl font-extrabold tracking-[-.04em] sm:text-6xl">{title}</h1>
        <p className="mt-5 max-w-2xl text-lg leading-8 text-on-brand-muted">{summary}</p>
        <p className="mt-5 text-sm text-on-brand-muted">Effective date: {EFFECTIVE_DATE}</p>
      </div>
    </header>
    <div className="container-shell max-w-4xl py-16">
      <div className="space-y-10 text-[17px] leading-8 text-muted [&_a]:font-semibold [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4 [&_h2]:text-2xl [&_h2]:font-extrabold [&_h2]:tracking-tight [&_h2]:text-text [&_li]:ml-5 [&_li]:list-disc">
        {children}
      </div>
    </div>
  </article>;
}

export function Privacy() {
  return <LegalPage
    eyebrow="Privacy"
    title="Privacy Policy"
    summary="How EkSaha collects, uses, stores and shares personal information when you use our website, client portal and services."
  >
    <section>
      <h2>1. Who we are</h2>
      <p>EkSaha provides SEO, web development, digital advertising and technical support services. We operate in Australia and Nepal and serve clients worldwide. In this policy, “EkSaha”, “we”, “us” and “our” refer to EkSaha.</p>
      <p className="mt-3">We aim to handle personal information consistently with the Privacy Act 1988 (Cth) and the Australian Privacy Principles where they apply, together with other applicable privacy obligations.</p>
    </section>

    <section>
      <h2>2. Information we collect</h2>
      <p>Depending on how you interact with EkSaha, we may collect:</p>
      <ul className="mt-3 space-y-2">
        <li>Identity and contact information, such as your name, email address and phone number.</li>
        <li>Account information, including login credentials stored in protected form, email-verification status, role and account preferences.</li>
        <li>Google account profile information when you choose Google sign-in, such as your name and email address.</li>
        <li>Service and commercial information, including selected plans, subscriptions, invoices, billing references and service assignments.</li>
        <li>Support information, including tickets, messages, attachments and details needed to resolve a request.</li>
        <li>Content you submit for publication or service delivery.</li>
        <li>Technical information such as IP address, browser information, request logs, security events, cookies and local-storage data necessary to operate and secure the service.</li>
        <li>Communications and any other information you choose to provide directly.</li>
      </ul>
      <p className="mt-3">Please do not provide sensitive information unless it is necessary and we have agreed to receive it.</p>
    </section>

    <section>
      <h2>3. How we collect information</h2>
      <p>We collect information directly when you create an account, contact us, purchase or request a service, submit a ticket, communicate with our team or use the client portal. We may also receive information from an administrator acting for your organisation, Google when you use Google sign-in, and providers that help deliver our services.</p>
    </section>

    <section>
      <h2>4. Why we use information</h2>
      <p>We use personal information to:</p>
      <ul className="mt-3 space-y-2">
        <li>Provide, administer and improve our website, portal and professional services.</li>
        <li>Create and secure accounts, authenticate users and prevent misuse.</li>
        <li>Manage service requests, subscriptions, invoices and customer support.</li>
        <li>Send operational messages such as verification, ticket and invoice emails.</li>
        <li>Respond to inquiries and communicate about an existing relationship.</li>
        <li>Maintain business records, meet legal obligations and resolve disputes.</li>
        <li>Protect EkSaha, our clients and users from fraud, security threats and unlawful activity.</li>
      </ul>
      <p className="mt-3">We will not sell personal information. We will only send marketing communications where we have the required consent or another lawful basis, and messages will provide an appropriate way to opt out.</p>
    </section>

    <section>
      <h2>5. Cookies and local storage</h2>
      <p>Our application uses storage technologies necessary for authentication, security and user preferences. These may include a secure refresh-token cookie, temporary authentication cookies, browser local storage for an access token, and saved display preferences such as theme selection.</p>
      <p className="mt-3">If we introduce optional analytics or advertising technologies, we will update this policy and provide any notices or consent controls required by applicable law.</p>
    </section>

    <section>
      <h2>6. When we share information</h2>
      <p>We may disclose information to team members and contractors who need it to perform their responsibilities, and to service providers that support hosting, data storage, authentication, email delivery, file storage, support, billing and security. Current infrastructure may include Cloudflare, Google and Resend, together with payment or professional-service providers enabled for a particular client relationship.</p>
      <p className="mt-3">We may also disclose information with your direction or consent, during a genuine business transaction, to professional advisers, or where required or authorised by law. Providers may process information outside Australia, including in Nepal, the United States and other locations in which their infrastructure or personnel operate.</p>
    </section>

    <section>
      <h2>7. Security and retention</h2>
      <p>We use reasonable technical and organisational safeguards designed to protect personal information. No internet or storage system is completely secure, so we cannot guarantee absolute security.</p>
      <p className="mt-3">We retain information only for as long as reasonably needed for service delivery, account administration, security, legal obligations, dispute resolution and legitimate business records. Retention periods vary by the type of information and the relationship involved.</p>
    </section>

    <section>
      <h2>8. Access, correction and deletion</h2>
      <p>You may request access to personal information we hold about you, ask us to correct inaccurate information, or request deletion where applicable. Some information may need to be retained for legal, security or record-keeping reasons.</p>
      <p className="mt-3">Send requests to <a href={`mailto:${PUBLIC_EMAIL}`}>{PUBLIC_EMAIL}</a>. We may need to verify your identity before completing a request.</p>
    </section>

    <section>
      <h2>9. Privacy questions and complaints</h2>
      <p>Contact us first so we can review and respond to a privacy concern. Email <a href={`mailto:${PUBLIC_EMAIL}`}>{PUBLIC_EMAIL}</a> or call <a href={`tel:${PUBLIC_PHONE}`}>{PUBLIC_PHONE_DISPLAY}</a>. If Australian privacy law applies and you are not satisfied with our response, you may be able to contact the Office of the Australian Information Commissioner.</p>
    </section>

    <section>
      <h2>10. Children</h2>
      <p>Our services are intended for businesses and people able to enter a binding agreement. They are not directed to children, and we do not knowingly seek personal information from children.</p>
    </section>

    <section>
      <h2>11. Changes to this policy</h2>
      <p>We may update this policy when our services, providers or legal obligations change. The effective date at the top identifies the current version. Material changes may also be communicated through the service or by email where appropriate.</p>
    </section>

    <section>
      <h2>12. Contact</h2>
      <p>EkSaha operates in Australia and Nepal and serves clients worldwide. Contact us at <a href={`mailto:${PUBLIC_EMAIL}`}>{PUBLIC_EMAIL}</a>, by phone at <a href={`tel:${PUBLIC_PHONE}`}>{PUBLIC_PHONE_DISPLAY}</a>, or through our <Link to="/contact">contact page</Link>.</p>
    </section>
  </LegalPage>;
}

export function Terms() {
  return <LegalPage
    eyebrow="Legal"
    title="Terms of Service"
    summary="The terms that apply when you access EkSaha’s website, client portal or professional services."
  >
    <section>
      <h2>1. Agreement to these terms</h2>
      <p>These Terms of Service form an agreement between you and EkSaha. By accessing our website, creating an account, accepting an order or service agreement, or using our services, you agree to these terms. If you act for an organisation, you confirm that you have authority to bind it.</p>
      <p className="mt-3">A written proposal, order, statement of work or service agreement may contain additional terms. If there is a conflict, the more specific signed or accepted document takes priority for that service.</p>
    </section>

    <section>
      <h2>2. Our services</h2>
      <p>EkSaha provides SEO, web development, digital advertising, technical support and related digital services. The exact scope, priorities, capacity, timing, fees and deliverables are set out in the applicable plan, proposal or service agreement.</p>
      <p className="mt-3">Digital performance depends on factors outside our control, including search engines, advertising platforms, third-party systems, market conditions and client decisions. We do not guarantee rankings, traffic, advertising returns, uninterrupted availability or a particular commercial result unless expressly stated in a signed agreement.</p>
    </section>

    <section>
      <h2>3. Accounts and security</h2>
      <p>You must provide accurate information, keep credentials secure and promptly tell us about suspected unauthorised access. You are responsible for activity performed through your account unless caused by our breach of these terms or applicable law. We may require verification and may restrict access where reasonably necessary to protect the service or users.</p>
    </section>

    <section>
      <h2>4. Client responsibilities</h2>
      <p>You agree to provide timely instructions, content, decisions and access reasonably required to deliver the services. You confirm that you have the rights and permissions needed for materials, accounts and data you provide.</p>
      <p className="mt-3">You remain responsible for final business decisions, legal and regulatory compliance specific to your organisation, and reviewing deliverables before publication or use where review is reasonably possible.</p>
    </section>

    <section>
      <h2>5. Fees, subscriptions and taxes</h2>
      <p>Fees, billing frequency, included capacity and any minimum term are shown before purchase or recorded in the relevant service agreement. You must pay valid invoices by their due date and provide accurate billing information. Prices may exclude applicable taxes unless stated otherwise.</p>
      <p className="mt-3">We will give reasonable notice of changes to recurring fees where required. Cancellation, renewal, refunds and work in progress are handled according to the applicable plan or service agreement and rights that cannot lawfully be excluded.</p>
    </section>

    <section>
      <h2>6. Intellectual property</h2>
      <p>You retain ownership of materials you provide. EkSaha and its licensors retain ownership of pre-existing methods, templates, software, know-how, tools and materials developed independently of your engagement.</p>
      <p className="mt-3">Ownership or licensing of custom deliverables is determined by the relevant service agreement. Unless that agreement states otherwise, any transfer of ownership is conditional on payment of all amounts due. We may use general skills, ideas and experience that do not reveal your confidential information.</p>
    </section>

    <section>
      <h2>7. Third-party services</h2>
      <p>Our work may interact with platforms operated by third parties, including search engines, advertising networks, hosting providers, authentication providers and software vendors. Their separate terms, availability and decisions apply. We are not responsible for a third party’s independent acts, policy changes or service interruptions, subject to rights that cannot be excluded by law.</p>
    </section>

    <section>
      <h2>8. Acceptable use</h2>
      <p>You must not use EkSaha’s systems or services to break the law, infringe rights, distribute malware, send unlawful unsolicited messages, bypass security, interfere with other users, obtain unauthorised access or submit content that is fraudulent, deceptive or harmful.</p>
    </section>

    <section>
      <h2>9. Confidentiality</h2>
      <p>Each party must use reasonable care to protect confidential information received from the other and use it only for the relationship. This does not apply to information that is public through no breach, already lawfully known, independently developed, or required to be disclosed by law.</p>
    </section>

    <section>
      <h2>10. Australian Consumer Law</h2>
      <p>Nothing in these terms excludes, restricts or modifies a guarantee, right or remedy that cannot lawfully be excluded, including rights that may apply under the Australian Consumer Law. Where the law permits liability to be limited, the applicable service agreement may set out that limitation.</p>
    </section>

    <section>
      <h2>11. Liability</h2>
      <p>To the maximum extent permitted by law, neither party is liable to the other for indirect or consequential loss, loss of opportunity, or loss caused by events outside its reasonable control. Any more specific liability allocation or cap must be stated in the applicable service agreement.</p>
      <p className="mt-3">This section does not limit liability where doing so would be unlawful, or liability arising from fraud, wilful misconduct, or another matter expressly excluded from limitation by applicable law.</p>
    </section>

    <section>
      <h2>12. Suspension and termination</h2>
      <p>Either party may end a service as allowed by the applicable plan or service agreement. We may suspend access where reasonably necessary for security, unlawful use, material breach or overdue payment, after notice where practical. On termination, accrued payment obligations and provisions intended to continue will survive.</p>
    </section>

    <section>
      <h2>13. Changes</h2>
      <p>We may update these terms for future use of the website or services. We will identify the effective date and provide reasonable notice of material changes where required. Changes to an existing signed service agreement require the process stated in that agreement.</p>
    </section>

    <section>
      <h2>14. Governing law</h2>
      <p>These terms are governed by the laws of New South Wales, Australia. The parties submit to the courts of New South Wales and courts entitled to hear appeals from them, subject to any non-excludable rights or jurisdiction that applies.</p>
    </section>

    <section>
      <h2>15. Contact</h2>
      <p>Questions about these terms can be sent to <a href={`mailto:${PUBLIC_EMAIL}`}>{PUBLIC_EMAIL}</a> or raised through our <Link to="/contact">contact page</Link>.</p>
    </section>
  </LegalPage>;
}

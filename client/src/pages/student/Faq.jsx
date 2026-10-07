import PageHead from "../../components/PageHead";

const faqs = [
  {
    q: "How long before someone responds?",
    a: "Most complaints get a first reply within two school days. Safety concerns are handled first."
  },
  {
    q: "What do the statuses mean?",
    a: "Pending means nobody has picked it up yet. In progress means the school is working on it. Resolved means the issue has been handled. Rejected means it couldn't be acted on, and the reply explains why."
  },
  {
    q: "Can I edit a complaint after sending it?",
    a: "Not yet. If you made a mistake, withdraw it while it's still pending and file a new one."
  },
  {
    q: "Who can see my complaint?",
    a: "Only you and the school admins. Other students and teachers can't see your name or what you filed."
  },
  {
    q: "Should I attach a photo?",
    a: "Yes, when you can. A clear photo of the problem and the room or area helps the right office find it faster."
  },
  {
    q: "What if it's an emergency?",
    a: "Don't wait for a reply here. Go to the nearest teacher, the guidance office or campus security right away."
  }
];

export default function Faq() {
  return (
    <>
      <PageHead title="Frequently asked questions" sub="Quick answers about filing and tracking complaints." />
      <div className="faq">
        {faqs.map((f) => (
          <details key={f.q} className="panel">
            <summary>{f.q}</summary>
            <p>{f.a}</p>
          </details>
        ))}
      </div>
    </>
  );
}

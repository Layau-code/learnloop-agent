const checkpoints = [
  {
    title: "T01-T03",
    description: "Monorepo, Docker Compose, FastAPI and Next.js shells are scaffolded."
  },
  {
    title: "T04-T07",
    description: "Alembic, core models, repositories, workflow run and event infrastructure are in place."
  },
  {
    title: "T08-T09",
    description: "Model adapter and observability baselines are ready for the next implementation passes."
  }
];

export default function HomePage() {
  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Execution Pack</p>
        <h2>Project Overview</h2>
        <p className="lede">
          The repository has moved from planning-only into an implementation-ready scaffold.
        </p>
      </div>

      <div className="card-grid">
        {checkpoints.map((item) => (
          <article key={item.title} className="card">
            <p className="card-label">{item.title}</p>
            <h3>{item.title} ready</h3>
            <p>{item.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}


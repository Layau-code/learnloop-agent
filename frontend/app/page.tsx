const checkpoints = [
  {
    title: "Browser First",
    description: "The project is being built as a browser-based workflow product, not a mobile app."
  },
  {
    title: "Ingest Loop",
    description: "You can already create a material, parse it, chunk it and generate a distill draft."
  },
  {
    title: "Next Step",
    description: "The current focus is wiring draft approval and knowledge write-back into visible web pages."
  }
];

export default function HomePage() {
  return (
    <section className="page">
      <div className="page-header">
        <p className="eyebrow">Overview</p>
        <h2>网页版开发进度</h2>
        <p className="lede">
          这个仓库现在已经从“只有文档”进入了“浏览器里能逐步看到主流程长出来”的阶段。
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

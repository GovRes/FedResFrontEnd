import styles from "../components/ally/ally.module.css";
export function delayAllyChat({
  allyStatements,
}: {
  allyStatements: Array<string>;
}) {
  let delay = 0;
  let allyFormattedGraphs = allyStatements.map((statement) => {
    let p = (
      <p
        key={delay}
        style={{ animationDelay: `${delay}s` }}
        className={styles.fade}
      >
        {statement}
      </p>
    );
    delay += 1;
    return p;
  });
  return { allyFormattedGraphs, delay };
}

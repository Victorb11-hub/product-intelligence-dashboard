const styles = {
  buy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  watch: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  pass: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
}

export default function VerdictBadge({ verdict }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${styles[verdict] || styles.watch}`}>
      {verdict}
    </span>
  )
}

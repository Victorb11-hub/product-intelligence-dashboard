import { useState } from 'react'

const S = ({ title, children }) => {
  const [open, setOpen] = useState(false)
  return (
    <div className="border border-gray-200 dark:border-[#1a1a1a] mb-2">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-[#141414]">
        <span className="text-xs font-bold text-gray-900 dark:text-white">{title}</span>
        <span className="text-gray-400 text-xs">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="px-4 pb-4 text-xs text-gray-600 dark:text-gray-400 leading-relaxed space-y-3">{children}</div>}
    </div>
  )
}

const Row = ({ label, value, good, bad }) => (
  <div className="border-b border-gray-100 dark:border-[#1a1a1a] py-2">
    <div className="flex justify-between items-baseline mb-1"><span className="font-bold text-gray-900 dark:text-white">{label}</span>{value && <span className="text-indigo-500 tabular-nums">{value}</span>}</div>
    {good && <p className="text-[11px]"><span className="text-emerald-600 font-medium">Good:</span> {good}</p>}
    {bad && <p className="text-[11px]"><span className="text-red-500 font-medium">Bad:</span> {bad}</p>}
  </div>
)

const Intent = ({ level, label, color, desc, examples }) => (
  <div className="flex gap-3 py-2 border-b border-gray-100 dark:border-[#1a1a1a]">
    <span className={`px-2 py-0.5 text-[10px] font-bold h-fit ${color}`}>L{level}</span>
    <div>
      <p className="font-bold text-gray-900 dark:text-white mb-0.5">{label}</p>
      <p className="text-[11px] mb-1">{desc}</p>
      {examples.map((e, i) => <p key={i} className="text-[11px] text-gray-500 italic">"{e}"</p>)}
    </div>
  </div>
)

export default function Help() {
  return (
    <div className="p-4 md:p-6 max-w-3xl">
      <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-tight mb-1">Help & Formula Guide</h1>
      <p className="text-xs text-gray-500 mb-5">Everything you need to understand the scoring system and make sourcing decisions</p>
      <FormulaGuide />
    </div>
  )
}

export function FormulaGuide() {
  return (
    <div>
      <S title="1 — How the Score is Built">
        <div className="space-y-2">
          <Step n={1} text="Data collected from up to 12 platforms across 4 scoring jobs" />
          <Step n={2} text="Each platform produces a sub-score 0–100" />
          <Step n={3} text="Platform sub-scores weighted and combined into a job score" />
          <Step n={4} text="Job scores weighted and combined into a raw composite score" />
          <Step n={5} text="Coverage penalty applied — fewer active platforms = lower confidence" />
          <Step n={6} text="Override rules checked — can force verdict up or down" />
          <Step n={7} text="Final verdict assigned: Buy ≥ 75 · Watch ≥ 55 · Pass < 55" />
        </div>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-[#0d0d0d] border border-gray-200 dark:border-[#1a1a1a]">
          <p className="font-bold text-gray-900 dark:text-white text-[11px] mb-2">Worked Example: Korean Sheet Masks</p>
          <div className="space-y-1 text-[11px] font-mono">
            <p><span className="text-gray-500">Reddit sub-score:</span> sentiment 49.0 + velocity 3.3 + intent 21.0 + volume 72.1 = <span className="text-indigo-500 font-bold">36.3</span></p>
            <p><span className="text-gray-500">Google Trends sub:</span> slope 78.4 + YoY 100.0 + no-breakout 20 = <span className="text-indigo-500 font-bold">91.3</span></p>
            <p><span className="text-gray-500">Job 2 combined:</span> Reddit (44%) 16.0 + GT (56%) 51.2 = <span className="text-indigo-500 font-bold">67.3</span></p>
            <p><span className="text-gray-500">Quality multiplier:</span> 67.3 × 0.97 = <span className="text-indigo-500 font-bold">65.3 raw</span></p>
            <p><span className="text-gray-500">Coverage penalty:</span> 1 of 4 jobs active → 25% → ×0.625</p>
            <p><span className="text-gray-500">Adjusted score:</span> 65.3 × 0.625 = <span className="font-bold text-red-500">40.8 PASS</span></p>
            <p className="text-gray-400 mt-2">The raw 65.3 looks like Watch, but with only 1 of 4 scoring jobs having data, the honest adjusted score is 40.8. Activate Amazon and Alibaba to fill Jobs 3 and 4 — the score will rise if demand is real.</p>
          </div>
        </div>
      </S>

      <S title="2 — What Each Signal Means">
        <p className="font-bold text-gray-900 dark:text-white mb-2">REDDIT SIGNALS</p>
        <Row label="Mention Volume" value="253 posts" good="100+ posts = strong signal, 500+ = exceptional" bad="Under 20 posts = insufficient data to score" />
        <Row label="Sentiment Score" value="−0.02" good="Above +0.2 = positive community reception" bad="Below −0.2 = negative sentiment — investigate before sourcing" />
        <Row label="Intent Score" value="0.21" good="Above 0.35 = strong buying intent confirmed" bad="Below 0.15 = people talking but not buying" />
        <Row label="High Intent Posts" value="56" good="50+ high intent posts per run" bad="Under 10 = weak purchase signal" />
        <Row label="Buy Intent Mentions" value="128" good="1 buy mention per 10 posts = healthy ratio" bad="Under 5% of posts = awareness without action" />
        <Row label="Repeat Purchase %" value="10.1%" good="Above 15% = strong retention, product has staying power" bad="Under 5% = one-time buyers, possible fad" />

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-4">GOOGLE TRENDS SIGNALS</p>
        <Row label="24-Month Slope" value="0.0057" good="Above 0.003 = meaningful sustained growth" bad="Negative = declining search interest" />
        <Row label="YoY Growth" value="132%" good="Above 50% = strong momentum. Above 100% = breakout category" bad="Negative = category is shrinking year over year" />
        <Row label="Breakout Flag" value="False" good="False = organic sustained growth (safe to source)" bad="True = sudden spike — could be fad or one-time viral moment" />
        <Row label="Seasonal Pattern" value="new_year_spike" good="Predictable seasonality helps with inventory timing" bad="No pattern = harder to predict demand windows" />

        <p className="text-[11px] text-gray-400 mt-3">All values shown are from the most recent Korean Sheet Masks run.</p>
      </S>

      <S title="3 — Intent Level Guide (L1–L5)">
        <Intent level={1} label="AWARENESS" color="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
          desc="Person knows the product exists. Signal value: Low — awareness is not demand."
          examples={["I keep seeing Korean sheet masks everywhere", "Has anyone tried these?", "What is the hype about sheet masks?"]} />
        <Intent level={2} label="INTEREST" color="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
          desc="Person is curious and researching. Signal value: Moderate — research phase."
          examples={["Which sheet mask brand is best?", "Do these actually work for dry skin?", "Thinking about trying sheet masks"]} />
        <Intent level={3} label="CONSIDERATION" color="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          desc="Person is actively evaluating buying. Signal value: Good — close to purchase."
          examples={["I narrowed it down to SKIN1004 or Benton", "Is $15 reasonable for a pack of 10?", "Where do you buy these in the US?"]} />
        <Intent level={4} label="INTENT" color="bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
          desc="Person is about to buy or just bought. Signal value: Strong — imminent purchase."
          examples={["Just added these to my cart", "About to order the TOSOWOONG ones", "These just arrived — excited to try"]} />
        <Intent level={5} label="PURCHASE CONFIRMED" color="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300"
          desc="Person has bought and describes the experience. Signal value: Highest — confirmed buyer."
          examples={["I actually just bought one by TOSOWOONG", "On my 4th pack — these are amazing", "Been using these for months, buying again"]} />
      </S>

      <S title="4 — Weight Setting Guide">
        <p className="font-bold text-gray-900 dark:text-white mb-2">JOB WEIGHTS — when to adjust</p>
        <p><strong>Early product discovery:</strong> Increase Job 1 (Early Detection) — catch trends before they peak</p>
        <p><strong>Validating before a large order:</strong> Increase Job 3 (Purchase Intent) — need confirmed buyer demand</p>
        <p><strong>Supply chain is your constraint:</strong> Increase Job 4 (Supply Readiness) — sourcing window matters most</p>

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-4">SIGNAL WEIGHTS — rules of thumb</p>
        <div className="space-y-1">
          <p><span className="font-mono text-indigo-500">1.0</span> = this signal is as important as the formula assumes</p>
          <p><span className="font-mono text-emerald-500">1.5</span> = you trust this signal more (e.g. sentiment is highly predictive in your category)</p>
          <p><span className="font-mono text-amber-500">0.7</span> = you trust this signal less (e.g. Reddit volume is noisy in skincare because of enthusiast bias)</p>
          <p><span className="font-mono text-red-500">0.5</span> = minimum weight — heavily discounted but not ignored</p>
        </div>

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-4">VERDICT THRESHOLDS</p>
        <p><strong>Lower Buy threshold (e.g. 65):</strong> Willing to take more risk, act on earlier signals</p>
        <p><strong>Raise Buy threshold (e.g. 85):</strong> Only source with very strong multi-platform confirmation</p>
        <p>Thresholds should reflect your risk tolerance and typical order size.</p>
      </S>

      <S title="5 — Common Mistakes">
        <Mistake n={1} title="Trusting a high score with low coverage"
          text="A score of 70 with 25% coverage is NOT a Watch signal. It means one platform looks good. Wait for more data or activate more platforms before acting." />
        <Mistake n={2} title="Ignoring the fad flag"
          text="If Google Trends shows a spike not a slope, the product may be viral today and gone in 90 days. Always check breakout flag before sourcing." />
        <Mistake n={3} title="Treating Reddit volume as demand"
          text="High Reddit discussion means awareness not purchases. Always look at intent score and buy mentions — volume without intent is just noise." />
        <Mistake n={4} title="Sourcing at peak"
          text="If the score is 85+ and rising fast, you may already be late. The best sourcing window is when the score crosses Watch into Buy on a rising slope — not at the peak." />
        <Mistake n={5} title="Changing weights without running Recompute"
          text="If you adjust weights always hit Recompute to see the immediate impact on all active products before deciding whether to keep the change." />
      </S>

      <S title="6 — Reading the Dashboard">
        <p className="font-bold text-gray-900 dark:text-white mb-2">LEADERBOARD</p>
        <Def term="Adjusted Score" def="The honest number based on available data — this is what you use for decisions" />
        <Def term="Raw Score" def="What active platforms say before coverage penalty — shows potential if more data were available" />
        <Def term="Coverage bar" def="How complete the data picture is (e.g. 1/4 = only 1 of 4 scoring jobs has data)" />
        <Def term="Phase" def="Where the product is in its trend lifecycle: early → buy_window → peak → plateau → declining" />

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-3">SCORECARD</p>
        <Def term="Green platform cards" def="Ran this cycle — real data contributing to the score" />
        <Def term="Gray platform cards" def="Not yet activated — shows what this platform would add when turned on" />
        <Def term="Score chart" def="Trend direction — meaningful after 7+ daily pipeline runs" />

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-3">RESEARCH COUNCIL</p>
        <Def term="Vote tally (e.g. 4-1)" def="4 agents agree, 1 dissents — read the dissenter's reasoning" />
        <Def term="Confidence %" def="How certain the agent is about their vote (0–100)" />
        <Def term="Dissent badge" def="Agent disagrees with the composite score — always read their reasoning" />

        <p className="font-bold text-gray-900 dark:text-white mb-2 mt-3">FORMULA STUDIO</p>
        <Def term="Job weight sliders" def="How much each category of data matters in the composite" />
        <Def term="Signal weights" def="How much each individual metric matters within a job" />
        <Def term="Override rules" def="Automatic adjustments that can override the math when conditions are met" />
      </S>
    </div>
  )
}

function Step({ n, text }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">{n}</span>
      <span className="text-[12px]">{text}</span>
    </div>
  )
}

function Mistake({ n, title, text }) {
  return (
    <div className="py-2 border-b border-gray-100 dark:border-[#1a1a1a]">
      <p className="font-bold text-gray-900 dark:text-white text-[12px] mb-0.5">Mistake {n}: {title}</p>
      <p className="text-[11px]">{text}</p>
    </div>
  )
}

function Def({ term, def }) {
  return <p className="text-[11px] py-0.5"><span className="font-bold text-gray-900 dark:text-white">{term}:</span> {def}</p>
}

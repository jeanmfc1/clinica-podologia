// Varre os .tsx e adiciona as variantes "dark:" das cores comuns.
// Rodar UMA vez: node scripts/darkmode.cjs
const fs = require('fs')
const path = require('path')
const dir = path.join(__dirname, '..', 'src')

const map = {
  'text-slate-900': 'dark:text-slate-50',
  'text-slate-800': 'dark:text-slate-100',
  'text-slate-700': 'dark:text-slate-200',
  'text-slate-600': 'dark:text-slate-300',
  'text-slate-500': 'dark:text-slate-400',
  'text-slate-400': 'dark:text-slate-500',
  'bg-white': 'dark:bg-slate-800',
  'bg-slate-50': 'dark:bg-slate-800',
  'bg-slate-100': 'dark:bg-slate-700',
  'bg-slate-200': 'dark:bg-slate-700',
  'border-slate-200': 'dark:border-slate-700',
  'border-slate-300': 'dark:border-slate-600',
  'border-slate-100': 'dark:border-slate-700',
  'divide-slate-200': 'dark:divide-slate-700',
  'divide-slate-100': 'dark:divide-slate-700',
  'bg-green-50': 'dark:bg-green-950/40',
  'bg-amber-50': 'dark:bg-amber-950/40',
  'bg-blue-50': 'dark:bg-blue-950/40',
  'bg-red-50': 'dark:bg-red-950/40',
  'bg-brand-50': 'dark:bg-brand-900/40',
}

const tokens = Object.keys(map).sort((a, b) => b.length - a.length)
const re = new RegExp(
  '\\b(' + tokens.map((t) => t.replace(/\//g, '\\/')).join('|') + ')(?=[ "\'`])',
  'g',
)

let total = 0
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f)
    const s = fs.statSync(p)
    if (s.isDirectory()) walk(p)
    else if (f.endsWith('.tsx')) {
      const c = fs.readFileSync(p, 'utf8')
      let n = 0
      const out = c.replace(re, (m) => {
        n++
        return m + ' ' + map[m]
      })
      if (n > 0) {
        fs.writeFileSync(p, out)
        total += n
        console.log(`${f}: ${n}`)
      }
    }
  }
}
walk(dir)
console.log('total substituições:', total)

# Improve Summary

- **Goal**: 提升 WillowTab 的用户增长和留存，增加 Chrome Web Store 评分
- **ICP**: 使用 Chrome/Edge 浏览器、追求简洁高效新标签页的个人用户
- **Research iterations**: 5 (one per category, all HIGH confidence)
- **Insights discovered**: 5
  - HIGH confidence: 5
  - MEDIUM confidence: 0
  - LOW confidence: 0
- **Output directory**: `autoresearch/improve-260619-1206/`

## Key Findings

### Competitive Landscape
| Competitor | Users | Rating | Key Weakness |
|-----------|-------|--------|-------------|
| Momentum | 2M+ | 4.5 | 17.5MB bloated, collects PII, promotional pop-ups |
| Tabliss | ~100K | - | No updates since 2022 |
| Bonjourr | 300K+ | - | Broken in China (Unsplash blocked) |
| Infinity New Tab | - | 4.6 | Sync failures, hidden malware |

### WillowTab's Unique Advantages
- Zero ads + zero data collection (privacy-first)
- Multi-engine search with Baidu (no competitor offers this)
- Local wallpaper rotation (works offline, works in China)
- Pure vanilla JS + Manifest V3 (lightweight, future-proof)
- GPL-3.0 open source

### MUST-HAVE Improvements (ranked)
1. Sub-100ms load time (P0)
2. Daily wallpaper rotation as default (P0)
3. Zero/minimum permissions (P0)
4. "Rate us" feedback loop (P1)
5. Regional search engine support (P1)
6. Sync failure prevention (P1)
7. Dark/light theme toggle (P1)
8. Clean onboarding (P1)

## Files Generated
- `improvement-plan.md` — Tiered ranking of improvements
- `prds.md` — 4 Product Requirements Documents
- `improve-results.tsv` — Raw research data
- `summary.md` — This overview

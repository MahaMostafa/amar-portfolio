/* The issue: 26 pages at 540×720, in reading order (front cover first, back cover last). */
(() => {
  const A = "assets/";
  const folio = (n, side) => `<div class="folio ${side}"><b>${n}</b><em></em><span>Amar · Portfolio</span></div>`;
  // the portfolio's tree artwork. side = "l" | "r" | "" lets a pair of pages share one continuous drawing
  const tree = (color, side = "", extra = "") => {
    const pos = side === "l" ? "0% 50%" : side === "r" ? "100% 50%" : "50% 50%";
    const size = side ? "1080px 1080px" : "cover";
    return `<div class="tree" style="--tree:${color};--tree-pos:${pos};--tree-size:${size};${extra}"></div>`;
  };
  const no = n => `N<sup style="font-size:.7em;vertical-align:.35em">o</sup>&thinsp;${n}`;

  const pages = [
    /* 0 · Front cover */
    { id: "cover", cls: "bleed", html: `
      <div class="img abs" style="inset:0"><img src="${A}x29.jpg" alt="Amar Suleiman sitting in a field of wildflowers" style="object-position:50% 30%"></div>
      <div class="abs" style="inset:0;background:linear-gradient(180deg,rgba(74,31,37,.9) 0%,rgba(74,31,37,.3) 27%,rgba(0,0,0,0) 42%,rgba(0,0,0,0) 58%,rgba(40,16,20,.8) 100%)"></div>
      <div class="abs" style="inset:0;padding:28px 32px;color:var(--cream);display:flex;flex-direction:column">
        <div style="display:flex;justify-content:space-between;font:500 10px/1 var(--sans);letter-spacing:.26em;text-transform:uppercase;opacity:.95"><span>Portfolio</span><span>2024/26</span></div>
        <div class="serif" style="font-size:168px;line-height:.8;margin:18px 0 0 -4px;letter-spacing:.01em;text-align:center">AMAR</div>
        <div class="serif it" style="font-size:19px;margin-top:10px;text-align:center;opacity:.92">Mohammed Fadel Suleiman</div>
        <div style="margin-top:auto;display:grid;grid-template-columns:1.2fr 1fr;gap:22px;align-items:end">
          <div>
            <div style="font:500 10px/1 var(--sans);letter-spacing:.24em;text-transform:uppercase;color:var(--blush);margin-bottom:10px">The cover story</div>
            <div class="serif" style="font-size:31px;line-height:1">Understanding people <span class="it">before</span> brands.</div>
          </div>
          <div style="border-top:1px solid rgba(246,241,234,.35);padding-top:10px;font:400 12.5px/1.5 var(--text)">
            <b style="font:500 9.5px/1 var(--sans);letter-spacing:.18em;text-transform:uppercase">Premier's Tea</b><br>A heritage brand, reframed<br>
            <b style="font:500 9.5px/1 var(--sans);letter-spacing:.18em;text-transform:uppercase">Sedra</b><br>Built for performance<br>
            <b style="font:500 9.5px/1 var(--sans);letter-spacing:.18em;text-transform:uppercase">Moon Muse</b><br>Selling a feeling
          </div>
        </div>
        <div style="margin-top:16px;font:500 10px/1 var(--sans);letter-spacing:.26em;text-transform:uppercase;opacity:.85;text-align:center">Marketing &amp; Brand Strategist</div>
      </div>` },

    /* 1 · Title spread, left: the PDF cover */
    { id: "title-l", html: `
      ${tree("rgba(100,42,49,.4)", "l")}
      <div class="abs" style="inset:0;background:linear-gradient(0deg,var(--paper) 0%,rgba(246,243,238,.9) 40%,rgba(246,243,238,0) 72%)"></div>
      <div style="height:100%;display:flex;flex-direction:column;justify-content:flex-end;padding-bottom:40px">
        <div class="kick">Marketing &amp; Brand Strategist</div>
        <div class="serif" style="font-size:112px;line-height:.85;margin-top:16px;letter-spacing:.005em">AMAR</div>
        <div class="serif it" style="font-size:21px;color:var(--ink-2);margin-top:8px">Mohammed Fadel Suleiman</div>
        <span class="orn"></span>
        <p class="lede" style="margin:0;color:var(--ink)">Understanding people before brands.<br>Blending strategy, storytelling,<br>and creative direction.<br>Building communication<br>that people actually connect with.</p>
      </div>` },

    /* 2 · Title spread, right: burgundy field */
    { id: "title-r", cls: "wine", html: `
      ${tree("rgba(35,10,14,.42)", "r")}
      <div class="abs" style="right:48px;top:50px;text-align:right">
        <div class="kick">Portfolio</div>
        <div class="serif it" style="font-size:17px;margin-top:8px;opacity:.85">2024/26</div>
      </div>
      <div class="abs" style="right:48px;bottom:56px;text-align:right;max-width:260px">
        <div class="orn3" style="justify-content:flex-end"><i></i><i></i><i></i></div>
        <div class="serif it" style="font-size:24px;line-height:1.15">Strategy, storytelling, and creative direction.</div>
      </div>` },

    /* 3 · Contents (left) */
    { id: "contents", html: `
      <div class="kick">In this issue</div>
      <div class="serif h2" style="margin-top:14px">Contents</div>
      <div class="rows" style="margin-top:18px">
        ${[["04", "About", "The strategist behind the work"], ["05", "Philosophy", "Discover, define, create, refine"], ["06", "Capabilities", "What I bring to the work"], ["09", "Premier's Tea", "A heritage tea, reframed"], ["11", "Sedra Al Bunian", "Built for performance"], ["13", "Fouq", "Saudi market positioning"], ["19", "Moon Muse", "A brand that sells a feeling"], ["21", "Experiences", "Self-initiated gatherings"], ["24", "Contact", "Let's talk"]]
          .map(([n, t, s]) => `<div style="padding:6px 0"><span class="num" style="font-size:21px">${n}</span><span><span class="serif st" style="font-size:18px">${t}</span><br><span class="small muted it" style="line-height:1.3">${s}</span></span></div>`).join("")}
      </div>
      ${folio("3", "l")}` },

    /* 4 · About (right) */
    { id: "about", html: `
      <div class="kick">${no("02")} · About</div>
      <div style="display:grid;grid-template-columns:1fr 162px;gap:24px;margin-top:20px">
        <div>
          <div class="serif h2">Amar<br><span class="it">Suleiman</span></div>
          <span class="orn"></span>
          <p class="lede dropcap" style="margin:0">Amar works at the intersection of strategy, communication, and creative direction, helping brands uncover what makes them distinct and how to express it clearly.</p>
        </div>
        <div class="img framed" style="height:214px;margin-top:4px"><img src="${A}x29.jpg" alt="Portrait of Amar" style="object-position:50% 25%"></div>
      </div>
      <p class="body" style="margin:16px 0 0">Her work combines brand thinking, content strategy, and creative leadership to build communication that feels aligned, human, and purposeful, turning ideas into experiences people remember.</p>
      <div class="grid2" style="margin-top:26px;border-top:1px solid var(--line);padding-top:16px">
        <div><div class="label">Role</div><div>Marketing Strategist<br>Brand Strategist<br>Creative Director<br>Content Strategist</div></div>
        <div><div class="label">Based in</div><div>Jordan / GCC</div></div>
      </div>
      ${folio("4", "r")}` },

    /* 5 · Approach (left) */
    { id: "approach", html: `
      <div class="kick">${no("03")} · Philosophy</div>
      <div class="serif h2" style="margin-top:16px">My Approach</div>
      <div class="rows" style="margin-top:24px">
        ${[["01", "Discover", "Understand the business, its goals, audience, and what makes it unique."], ["02", "Define", "Shape the positioning, messaging, and communication direction."], ["03", "Create", "Develop content, campaigns, and creative assets aligned with the strategy."], ["04", "Refine", "Measure, learn, and adapt to keep communication effective and relevant."]]
          .map(([n, t, s]) => `<div style="padding:14px 0"><span class="num">${n}</span><span><span class="serif st" style="font-size:20px">${t}</span><br><span class="body">${s}</span></span></div>`).join("")}
      </div>
      <div class="quote serif it" style="font-size:25px;line-height:1.15;margin-top:32px">“Clarity gives direction to creativity.”</div>
      ${folio("5", "l")}` },

    /* 6 · Capabilities (right) */
    { id: "capabilities", html: `
      <div class="kick">${no("04")} · Capabilities</div>
      <div class="serif h2" style="margin-top:16px">What I bring<br><span class="it">to the work</span></div>
      <div style="margin-top:20px">
        ${[["Brand Strategy", "Defining positioning, audience insights, and communication foundations that create clarity across every touchpoint."], ["Content Strategy", "Building content systems, editorial direction, and campaign structures that support business goals."], ["Creative Direction", "Guiding visual and verbal expression so ideas are translated with consistency and intention."], ["Copywriting", "Crafting bilingual communication, brand messaging, and campaigns that resonate across cultures."], ["Brand Audits", "Evaluating brands, platforms, and touchpoints to uncover opportunities for stronger positioning."]]
          .map(([t, s]) => `<div style="border-top:1px solid var(--line);padding:11px 0;display:grid;grid-template-columns:150px 1fr;gap:14px"><span class="serif st" style="font-size:18px;line-height:1.1">${t}</span><span class="body small">${s}</span></div>`).join("")}
      </div>
      ${folio("6", "r")}` },

    /* 7 · Selected Work (left, dark) */
    { id: "selected-l", cls: "dark", html: `
      <div class="kick">Selected work</div>
      <div class="serif" style="font-size:104px;line-height:.9;margin-top:130px;letter-spacing:-.01em">Selected<br><span class="it" style="padding-left:30px">Work</span></div>
      <div class="orn3" style="margin:34px 0 0 34px"><i></i><i></i><i></i></div>
      <div style="margin:16px 0 0 34px;font:500 10px/1 var(--sans);letter-spacing:.26em;text-transform:uppercase;opacity:.85">2024/26</div>
      ${folio("7", "l")}` },

    /* 8 · Work index (right, dark) */
    { id: "selected-r", cls: "dark", html: `
      <div class="kick" style="text-align:right">The index</div>
      <div class="rows" style="margin-top:140px">
        ${[["09", "Premier's Tea", "Content strategy · Arabic copywriting"], ["11", "Sedra Al Bunian", "Corporate narrative · Positioning"], ["13", "Fouq Creative Agency", "Hero case study · Saudi positioning"], ["19", "Moon Muse Candles", "Brand storytelling · Emotional positioning"], ["21", "Self-initiated", "Experience design · Community"]]
          .map(([n, t, s]) => `<div style="padding:13px 0"><span class="num" style="font-size:24px">${n}</span><span><span class="serif st" style="font-size:22px">${t}</span><br><span class="small it" style="opacity:.78">${s}</span></span></div>`).join("")}
      </div>
      ${folio("8", "r")}` },

    /* 9 · Premier's Tea (left) */
    { id: "premier", html: `
      <div class="kick">${no("06")} · Premier's Tea</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:16px">
        <div>
          <div class="serif h2">Premier's<br><span class="it">Tea</span></div>
          <span class="orn"></span>
          <p class="body" style="margin:0">A heritage tea brand established in 1988, reframed for a contemporary Arabic-speaking audience through content strategy, campaign concepts, and culturally relevant storytelling.</p>
          <p class="body" style="margin:10px 0 0">Product features became lifestyle moments: breakfast culture, family gatherings, seasons, moods. Each post a small story, not an advertisement.</p>
        </div>
        <div class="img" style="height:300px"><img src="${A}x28.jpg" alt="Premier's Tea Ramadan gathering post"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px;align-items:start">
        <div style="border-top:1px solid var(--burgundy);padding-top:10px"><div class="label">Role</div><div class="small">Monthly Content Planning<br>Campaign Concepts<br>Arabic Copywriting<br>Creative Direction</div></div>
        <div class="ar" style="background:var(--paper-2);border-inline-start:2px solid var(--burgundy);padding:12px 16px;font-size:15px;line-height:1.7">«اللمّة ما تكمل بدون Premier's<br>شاي يُعتمد عليه»</div>
      </div>
      ${folio("9", "l")}` },

    /* 10 · Premier's gallery (right) */
    { id: "premier-2", html: `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${["x27", "x23", "x24", "x25"].map(x => `<div class="img" style="height:232px"><img src="${A}${x}.jpg" alt="Premier's Tea social post"></div>`).join("")}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:20px">
        <div><div class="label">Content pillars</div><ul class="dl small body"><li>Mood &amp; lifestyle moments</li><li>Product storytelling</li><li>Cultural occasions: Ramadan, gatherings</li><li>Engagement carousels in Arabic</li></ul></div>
        <div><div class="label">Campaign logic</div><div class="small body">Each post connects a tea variety to a human feeling, building emotional equity rather than product awareness.</div></div>
      </div>
      ${folio("10", "r")}` },

    /* 11 · Sedra (left) */
    { id: "sedra", html: `
      <div class="kick">${no("08")} · Sedra Al Bunian</div>
      <div style="display:grid;grid-template-columns:1fr 184px;gap:24px;margin-top:16px">
        <div>
          <div class="serif h2">Sedra<br><span class="it">Al Bunian</span></div>
          <span class="orn"></span>
          <p class="body small" style="margin:0">A Saudi Class A general contractor building retail and F&amp;B environments since 2018. The brief: reposition a design and fit-out company as a trusted execution partner, from concept to completion, with a strategic, outcome-driven voice for the Saudi market.</p>
        </div>
        <div class="img" style="height:236px"><img src="${A}x15.jpg" alt="Sedra campaign visual"></div>
      </div>
      <div style="margin-top:24px;padding:20px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)">
        <div class="label">Positioning line</div>
        <div class="serif it" style="font-size:28px;line-height:1.1">“Delivered with Discipline.<br>Built for Performance.”</div>
      </div>
      <div style="margin-top:14px"><div class="label">Role</div><div class="small">Corporate Narrative · Communication Strategy · Brand Positioning · Creative Direction</div></div>
      ${folio("11", "l")}` },

    /* 12 · Sedra documents (right) */
    { id: "sedra-2", html: `
      <div class="img" style="height:168px"><img src="${A}x21.jpg" alt="Sedra company profile cover"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-top:8px">
        ${["x16", "x17", "x22"].map(x => `<div class="img" style="height:148px"><img src="${A}${x}.jpg" alt="Sedra campaign post"></div>`).join("")}
      </div>
      <div style="margin-top:20px"><div class="label">Narrative shift</div><div class="serif" style="font-size:20px;line-height:1.15">Design-focused company <span style="color:var(--burgundy)">→</span> <span class="it">end-to-end execution partner</span></div></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:18px">
        <div><div class="label">Campaign slogan</div><div class="ar" style="font-size:16px;text-align:right">«خلّك مع واحد»<br><span class="small">SEDRA جهة وحدة تقرر معك وتنفّذ</span></div></div>
        <div><div class="label">Documents built</div><ul class="dl small body"><li>Corporate Profile</li><li>Retail &amp; F&amp;B Sector Profiles</li><li>Sales Brochures</li><li>Arabic Content Framework</li></ul></div>
      </div>
      ${folio("12", "r")}` },

    /* 13 · Fouq (left, wine) */
    { id: "fouq", cls: "wine", html: `
      ${tree("rgba(35,10,14,.38)")}
      <div style="display:flex;justify-content:space-between"><div class="kick">${no("10")} · Fouq Creative Agency</div><div class="kick">Hero case study</div></div>
      <div class="serif" style="font-size:132px;line-height:.82;margin-top:36px;letter-spacing:.01em">FOUQ</div>
      <div class="serif it" style="font-size:24px;margin-top:40px">Saudi Market Positioning, 2025</div>
      <p class="body" style="margin:22px 0 0;max-width:380px">A comprehensive strategic audit and Saudi positioning framework for a multidisciplinary creative agency with presence across Jordan, KSA, UAE, and Qatar. The work repositioned Fouq from a visually driven studio into a culturally intelligent strategic partner.</p>
      <div class="quote serif it" style="font-size:22px;line-height:1.18;margin-top:30px">“Creativity is already Fouq's strength. Now we shape the perception and elevate the impact.”</div>
      ${folio("13", "l")}` },

    /* 14 · Fouq scope (right): the platform and website audit slides, redrawn from the originals */
    { id: "fouq-2", html: `
      <div class="kick">${no("10")} · Scope of work</div>
      <div class="serif h3" style="margin-top:12px">Seven audits, <span class="it">one position</span></div>
      <div class="scope small">
        ${["Instagram Audit", "LinkedIn Audit (B2B Saudi)", "Website Audit", "SWOT Analysis", "Saudi Market Behavior Insights", "USP Framework (EN + AR)", "Content &amp; Outreach Strategy"].map((s, i) => `<div class="mo" style="--i:${i}">${s}</div>`).join("")}
      </div>
      <figure class="viz" style="margin-top:22px">
        <figcaption class="viz-h"><span class="label">Platform performance audit</span><span class="legend"><span>90 days prior</span><span>Last 90 days</span></span></figcaption>
        <div class="kpis">
          ${[["Story reach", "2.2K", "18.9%", .84], ["Published stories", "149", "34.2%", .74], ["Story replies &amp; shares", "40", "5.3%", .95]]
            .map(([t, n, d, h], i) => `<div>
              <div class="kpi-t mo" style="--i:${4 + i}">${t}</div>
              <div class="kpi-v mo" style="--i:${5 + i}"><span class="kpi-n lnum">${n}</span><span class="kpi-d lnum">↑ ${d}</span></div>
              <div class="pair"><i class="grow-y" style="--h:${h};--i:${6 + i}"></i><i class="grow-y" style="--h:1;--i:${7 + i}"></i></div>
            </div>`).join("")}
        </div>
        <div class="media">
          <div class="kpi-t mo" style="--i:9">Median story reach per media type, last 90 days</div>
          <div class="hbars">
            <div class="hbar"><span>Images</span><s class="grow-x" style="--w:1;--i:10"></s><b class="lnum">220</b></div>
            <div class="hbar"><span>Videos</span><s class="grow-x" style="--w:${(214 / 220).toFixed(3)};--i:11"></s><b class="lnum">214</b></div>
            <div class="hbar zero mo" style="--i:12"><span>Audio, text, links</span><b class="lnum">0</b></div>
          </div>
        </div>
      </figure>
      <figure class="viz" style="margin-top:22px">
        <figcaption class="viz-h"><span class="label">Website audit</span><span class="viz-src">Clarifying the “At Fouq” section</span></figcaption>
        <div class="webaudit">
          <div class="mo" style="--i:13">
            <div class="wa-k">The current statement</div>
            <div class="wa-was"><q>We offer a unique marketing experience and exceptional customer service.</q></div>
            <div class="wa-why">Too generic: it does not reflect Fouq's true strengths or strategic value.</div>
          </div>
          <div class="wa-new wipe" style="--i:15">
            <div class="wa-k">Suggested direction</div>
            <div class="wa-en">A regional creative partner delivering culturally grounded strategy and high-end visual storytelling.</div>
            <div class="wa-ar" dir="rtl" lang="ar">شريك إبداعي إقليمي يقدّم إستراتيجية متجذّرة في الثقافة وقصصًا بصرية عالية الجودة.</div>
          </div>
        </div>
      </figure>
      ${folio("14", "r")}` },

    /* 15 · SWOT (left) */
    { id: "swot", html: `
      <div class="kick">${no("11")} · Research &amp; analysis</div>
      <div class="serif h2" style="margin-top:14px">SWOT <span class="it">Analysis</span></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px 22px;margin-top:18px" class="small body">
        <div><div class="label">Strengths</div><ul class="dl"><li>Strong creative diversity &amp; multidisciplinary production</li><li>Regional presence: KSA, Jordan, UAE, Qatar</li><li>Youthful, modern aesthetic with high production value</li><li>Strong internal culture and team identity</li></ul></div>
        <div><div class="label">Weaknesses</div><ul class="dl"><li>USPs not clearly communicated across platforms</li><li>Case studies lack strategic depth and metrics</li><li>Visual-heavy with minimal strategic context</li></ul></div>
        <div><div class="label">Opportunities</div><ul class="dl"><li>Saudi Arabia's growing demand for high-end creative</li><li>Gap in culturally tailored Arabic branding content</li><li>Thought leadership through LinkedIn &amp; podcast</li><li>Influence regional creative industry standards</li></ul></div>
        <div><div class="label">Threats</div><ul class="dl"><li>Major GCC agencies with large portfolios</li><li>High Saudi expectations for polish &amp; speed</li><li>Market saturation without strategic differentiation</li></ul></div>
      </div>
      <div style="margin-top:18px;background:var(--paper-2);padding:13px 16px">
        <div class="label">Saudi market insight</div>
        <div class="small body">Respectful, formal, Arabic-first communication; cinematic quality; cultural storytelling; proof of value through numbers and impact. Success in Saudi requires cultural fluency, not just creativity.</div>
      </div>
      ${folio("15", "l")}` },

    /* 16 · Positioning & USPs (right) */
    { id: "positioning", html: `
      <div class="kick">${no("12")} · Positioning framework</div>
      <div class="serif h2" style="margin-top:14px">Saudi Positioning<br><span class="it">&amp; USPs</span></div>
      <div style="margin-top:18px;border-top:1px solid var(--line);padding-top:12px">
        <div class="label">English positioning · Strategy &amp; creativity</div>
        <div class="serif it" style="font-size:19px;line-height:1.2">“Strategic thinking translated into high-impact creative execution.”</div>
      </div>
      <div style="margin-top:12px;border-top:1px solid var(--line);padding-top:12px">
        <div class="label">Arabic positioning</div>
        <div class="ar" style="font-size:16px;line-height:1.7">«شريك إبداعي كامل الخدمات برؤية خليجية وبفهم عميق للثقافة السعودية.»</div>
      </div>
      <div class="label" style="margin-top:16px">Suggested USPs</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px 20px" class="small body">
        ${[["GCC Cultural Insight", "Deep Gulf cultural understanding with presence in KSA, Jordan, UAE &amp; Qatar."], ["Arabic-First Branding", "Brand stories crafted natively in Arabic for authentic Saudi resonance."], ["Strategy + Creativity", "Strategic thinking fused with high-end creative execution, end to end."], ["Premium Production", "Saudi-standard quality: branding, 2D/3D, motion and production, integrated."]]
          .map(([t, s]) => `<div><div class="serif st" style="font-size:15px;color:var(--ink);margin-bottom:2px">${t}</div>${s}</div>`).join("")}
      </div>
      ${folio("16", "r")}` },

    /* 17 · Recommendations (left) */
    { id: "recs", html: `
      <div class="kick">${no("13")} · Recommendations</div>
      <div class="serif h2" style="margin-top:14px">Strategic <span class="it">moves</span></div>
      <div class="rows" style="margin-top:18px">
        ${[["Clarify &amp; communicate USP", "Pinned posts: showreel, services, Saudi positioning, in both languages."], ["Strengthen storytelling", "Dream → Insight → Strategy → Design → Execution → Impact case study format."], ["Launch a Saudi landing page", "Arabic-only, culturally tailored, showing Saudi case studies and local value."], ["Build thought leadership", "LinkedIn as strategic authority channel: insights, process, before/after stories."], ["Adopt a value-first sales model", "Micro-audits → bilingual outreach → rapport → WhatsApp → tailored proposals."], ["Elevate the website to conversion", "Narrative case studies with metrics, testimonials, a clear bilingual value proposition."]]
          .map(([t, s], i) => `<div style="padding:9px 0;grid-template-columns:40px 1fr"><span class="num" style="font-size:22px">${i + 1}</span><span><span class="serif st" style="font-size:15.5px">${t}</span><br><span class="small body">${s}</span></span></div>`).join("")}
      </div>
      ${folio("17", "l")}` },

    /* 18 · Ways of thinking (right) */
    { id: "thinking", html: `
      <div class="kick">${no("14")} · Ways of thinking</div>
      <div class="serif h3" style="margin-top:14px">Behind the frameworks,<br><span class="it">audits, and systems</span></div>
      <p class="body small" style="margin:12px 0 0">Frameworks developed across client engagements to help brands clarify their positioning, communication, and decision-making.</p>
      <figure class="cal">
        <figcaption class="viz-h"><span class="label">Monthly content plan · Premier's Tea</span><span class="viz-src">From the working sheet</span></figcaption>
        <div class="cal-t" dir="rtl" lang="ar">
          <div class="cal-r cal-head mo" style="--i:0"><span>النوع<small>Format</small></span><span>الموضوع<small>Topic</small></span><span>نوع الشاي<small>Tea</small></span><span>كابشن عالبوست<small>Caption</small></span></div>
          ${[["Reel / Shooting", "ريل الاطلاق 1", `<img src="${A}pt-pack-1.jpg" alt="Masala Chai pack">`, "إذا ضاعت علومك، ما لك إلّا <bdi>Masala Chai</bdi> من <bdi>Premier's Tea</bdi>. نكهة دافئة، غنيّة بالتوابل. لأن مزاجك يستاهل."],
             ["Reel / Shooting", "ريل الاطلاق 2", `<img src="${A}pt-pack-2.jpg" alt="Premier's Tea pack">`, "إذا تعقّدت الأفكار، ارجع للأساس. يمكن الحل يجي من كوب موزون. <bdi>Premier's Tea</bdi> كوب يضبط الإيقاع."],
             ["Video Motion", "اول يوم رمضان", "Assam Tea &amp; Green Tea", "رمضان كريم من <bdi>Premier's Tea</bdi>. تمنياتنا لكم بشهر مليان طمانينة، ولمّات دافئة، وأوقات تُعاش بهدوء."]]
            .map(([t, s, tea, c], i) => `<div class="cal-r mo" style="--i:${1 + i * 1.4}"><span class="cal-type">${t}</span><span class="cal-topic">${s}</span><span class="cal-tea">${tea}</span><span class="cal-cap wipe" style="--i:${2 + i * 1.4}">${c}</span></div>`).join("")}
        </div>
      </figure>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;margin-top:18px">
        ${[["Audit Frameworks", "Platform audits that identify gaps between brand intent and brand reality."], ["Monthly Systems", "Editorial planning structures that keep content consistent and culturally grounded."], ["Positioning Tools", "USP matrices, messaging architectures, and bilingual positioning frameworks."]]
          .map(([t, s]) => `<div style="border-top:1px solid var(--burgundy);padding-top:10px"><div class="serif st" style="font-size:15px;line-height:1.1">${t}</div><div class="small body" style="margin-top:6px">${s}</div></div>`).join("")}
      </div>
      ${folio("18", "r")}` },

    /* 19 · Moon Muse (left, full bleed) */
    { id: "moon", cls: "bleed", html: `
      <div class="img abs" style="inset:0"><img src="${A}x4.jpg" alt="Moon Muse candle among lavender"></div>
      <div class="abs" style="inset:0;background:linear-gradient(0deg,rgba(20,14,24,.85),rgba(20,14,24,0) 58%)"></div>
      <div class="abs" style="left:48px;right:48px;bottom:58px;color:var(--cream)">
        <div class="kick" style="color:var(--blush)">${no("15")} · Moon Muse Candles</div>
        <div class="serif" style="font-size:92px;line-height:.9;margin-top:24px">Moon<br><span class="it">Muse</span></div>
        <p style="margin:16px 0 0;max-width:340px;font:400 13.5px/1.55 var(--text);opacity:.92">A handcrafted candle brand built around emotional states (Focus, Relax, Dream, Bloom) rather than fragrance categories. A communication system that sells a feeling, not simply a product.</p>
      </div>` },

    /* 20 · Moon Muse scents (right) */
    { id: "moon-2", html: `
      <div class="label">Key insight</div>
      <div class="serif it" style="font-size:21px;line-height:1.2">“The fragrance menu became a wellness positioning tool; each scent named for what it does to you, not what it smells like.”</div>
      <div class="grid2" style="margin-top:22px;gap:12px">
        ${[["Focus", "Lemon &amp; peppermint. Energize, clarify.", "x6"], ["Relax", "Lavender. Tranquility, dissolve stress.", "x4"], ["Dream", "Vanilla, lemon, cinnamon. Joy, warmth.", "x5"], ["Bloom", "Tulips &amp; jasmine. Soul, awakening.", "x9"]]
          .map(([t, s, x]) => `<div><div class="img" style="height:124px"><img src="${A}${x}.jpg" alt="${t} candle"></div><div class="label" style="margin:10px 0 2px">${t}</div><div class="small body">${s}</div></div>`).join("")}
      </div>
      <div class="small muted it" style="margin-top:14px">Brand Storytelling · Emotional Positioning · Communication Architecture · Creative Direction</div>
      ${folio("20", "r")}` },

    /* 21 · Release & Return (left) */
    { id: "exp-1", html: `
      <div class="kick">${no("17")} · Self-initiated experiences</div>
      <div style="display:grid;grid-template-columns:1.15fr 1fr;gap:22px;margin-top:18px">
        <div class="img" style="aspect-ratio:1"><img src="${A}x1.jpg" alt="Release and Return poster"></div>
        <div>
          <div class="serif h3">Release<br><span class="it">&amp; Return</span></div>
          <div class="kick" style="margin-top:10px">Women's Circle</div>
          <p class="body small" style="margin:12px 0 0">A gentle evening of movement, sound, presence, and emotional release. Guided freeform dance, handpan sound healing, opening and reflective circles: a full sensory journey for women.</p>
        </div>
      </div>
      <div class="grid2" style="margin-top:24px;border-top:1px solid var(--line);padding-top:14px">
        <div><div class="label">Role</div><div class="small">Experience Concept<br>Community Building<br>Creative Direction<br>Communication Strategy</div></div>
        <div><div class="label">Where</div><div class="small">Le Réservoir, Amman<br>May 2025 · 25 JDs</div></div>
      </div>
      ${folio("21", "l")}` },

    /* 22 · Slow Down (right) */
    { id: "exp-2", html: `
      <div class="img" style="height:326px"><img src="${A}x2.jpg" alt="Slow Down. Learn. Create. candle workshop poster"></div>
      <div class="serif h3" style="margin-top:20px">Slow Down.<br><span class="it">Learn. Create.</span></div>
      <p class="body small" style="margin:12px 0 0;max-width:400px">A sensory candle-making experience where participants learn the craft, explore scent, and create their own candle to take home. Designed as a slow community ritual.</p>
      <div class="small muted it" style="margin-top:12px">Experience Design · Creative Direction · Messaging · Community Experience. Le Réservoir, Amman, May 2025.</div>
      ${folio("22", "r")}` },

    /* 23 · Closing (left, wine) */
    { id: "closing", cls: "wine", html: `
      ${tree("rgba(35,10,14,.4)", "l")}
      <div style="height:100%;display:flex;flex-direction:column;justify-content:center">
        <div class="serif" style="font-size:52px;line-height:1">Thoughtfully built.<br><span class="it">Intentionally communicated.</span></div>
        <div class="orn3" style="margin:30px 0"><i></i><i></i><i></i></div>
        <p class="lede" style="margin:0;max-width:340px">Brands deserve more than visibility. They deserve clarity, distinction, and a reason to be remembered.</p>
      </div>
      ${folio("23", "l")}` },

    /* 24 · Contact (right) */
    { id: "contact", html: `
      <div class="kick">${no("19")} · Contact</div>
      <div class="serif h2" style="margin-top:16px">Amar Mohammed<br><span class="it">Fadel Suleiman</span></div>
      <div class="kick" style="margin-top:14px;color:var(--ink-2)">Marketing &amp; Brand Strategist</div>
      <div style="margin-top:64px">
        ${[["Email", "amarmsuleiman@gmail.com", "mailto:amarmsuleiman@gmail.com"], ["LinkedIn", "linkedin.com/in/amarsuleiman", "https://linkedin.com/in/amarsuleiman"], ["Phone", "+962 79 208 5898", "tel:+962792085898"]]
          .map(([k, v, h]) => `<div style="display:grid;grid-template-columns:100px 1fr;align-items:baseline;border-top:1px solid var(--line);padding:14px 0"><span class="label" style="margin:0;color:var(--ink-3)">${k}</span><a href="${h}" style="color:var(--burgundy);text-decoration:none;font:500 16px/1.2 var(--serif)">${v}</a></div>`).join("")}
        <div style="border-top:1px solid var(--line)"></div>
      </div>
      <div class="serif it" style="font-size:20px;margin-top:50px">“Let's create brands that communicate with intention.”</div>
      ${folio("24", "r")}` },

    /* 25 · Back cover */
    { id: "back", cls: "wine", html: `
      ${tree("rgba(35,10,14,.45)")}
      <div class="abs" style="left:48px;right:48px;bottom:54px;color:var(--cream);text-align:center">
        <div class="serif" style="font-size:58px;line-height:.9;letter-spacing:.02em">AMAR</div>
        <div class="orn c" style="margin-block:16px"></div>
        <div style="font:500 9.5px/1.6 var(--sans);letter-spacing:.22em;text-transform:uppercase;opacity:.85">© 2026 Amar Mohammed Fadel Suleiman</div>
      </div>` },
  ];

  window.MAG_PAGES = pages;
  window.renderPage = (p) => `<div class="pg ${p.cls || ""}" data-page="${p.id}">${p.html}</div>`;
})();

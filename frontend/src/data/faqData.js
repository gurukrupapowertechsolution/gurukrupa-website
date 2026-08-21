/**
 * FAQ database for the /faq page and the Homepage teaser.
 *
 * Shape is deliberately flat and boring so entries can be appended without
 * touching any component:
 *
 *   { id, category, q, a }
 *
 *   id       — stable, unique, kebab-case. Used for React keys, deep links
 *              (/faq#the-id) and the TOP_FAQ_IDS list below. Never reuse one.
 *   category — must match an id in FAQ_CATEGORIES, or the entry renders in no
 *              group at all (assertUnknownCategories below will flag it).
 *   q        — the question, phrased the way a customer would ask it.
 *   a        — the answer. Blank lines separate paragraphs; the renderer splits
 *              on '\n\n'. Plain text only, no markup.
 *
 * Search on the FAQ page scans both q and a, so there is no keyword field to
 * maintain — write naturally and the words will be found.
 *
 * ⚠ CONFIRM WITH BUSINESS / REVIEW PERIODICALLY: subsidy slabs, the 300-unit
 * allowance, DCR rules, GERC settlement rates and PGVCL process timelines are
 * all policy-dependent and change. Figures here follow the values already used
 * across the site (SchemeCTA.jsx, RemainingPages.jsx Government Notes). Where a
 * number is genuinely volatile the answer says so and points at the portal
 * rather than stating a hard figure. Timelines are described as typical
 * experience, not as a contractual commitment.
 */

export const FAQ_CATEGORIES = [
  {
    id: 'sizing-cost',
    label: 'Sizing, Cost & Installation',
    blurb: 'What size you need, what it costs, and what installation week actually looks like.',
  },
  {
    id: 'on-grid',
    label: 'On-Grid Systems',
    blurb: 'Grid-tied systems — the standard choice for homes and businesses on a reliable supply.',
  },
  {
    id: 'hybrid',
    label: 'Hybrid & Battery Backup',
    blurb: 'Battery-backed systems for sites that cannot afford to go dark.',
  },
  {
    id: 'net-metering',
    label: 'Net Metering & Billing',
    blurb: 'How export credits, bidirectional meters and settlement work in Gujarat.',
  },
  {
    id: 'pgvcl',
    label: 'PGVCL Process & Compliance',
    blurb: 'Approvals, documentation and inspection with the Gujarat discom.',
  },
  {
    id: 'subsidy',
    label: 'PM Surya Ghar & Subsidy',
    blurb: 'The central residential subsidy — amounts, eligibility and how the money reaches you.',
  },
  {
    id: 'maintenance',
    label: 'Maintenance & Performance',
    blurb: 'Dust, salt air, cleaning, degradation and what the system needs from you.',
  },
];

/**
 * The five shown on the Homepage teaser, in display order.
 * Every id must exist in FAQS — assertTopFaqs() below will throw if one drifts.
 */
export const TOP_FAQ_IDS = [
  'subsidy-how-much',
  'net-metering-how-it-works',
  'cost-how-much',
  'on-grid-power-cut',
  'generation-in-gujarat',
];

export const FAQS = [
  /* ─────────────── Sizing, Cost & Installation ─────────────── */
  {
    id: 'cost-how-much',
    category: 'sizing-cost',
    q: 'How much does a rooftop solar system actually cost?',
    a: `As a working figure for a standard residential On-Grid system, budget in the region of ₹60,000 per kW before subsidy. A 3 kW system therefore lands around ₹1.8 lakh gross, and after the ₹78,000 central subsidy your real outlay is closer to ₹1 lakh.

That per-kW rate is indicative, not a quotation. What moves it is the panel and inverter brand you choose, whether the site needs an elevated mounting structure to keep your terrace usable, the cable run from the array to the meter position, and — for coastal sites — corrosion-rated structures. Hybrid systems sit meaningfully higher because of the battery bank.

The only honest way to get a firm number is to price your actual load and roof. Our quotation tool does the sizing arithmetic and returns a calculated estimate with the subsidy already deducted, so you see the real figure rather than a headline one.`,
  },
  {
    id: 'sizing-what-size',
    category: 'sizing-cost',
    q: 'What size system do I need for my electricity bill?',
    a: `Sizing is driven by units consumed, not by rupees. Take the monthly units from your PGVCL bill, divide by 30 to get your daily consumption, then divide that by about 4 to 4.5 — the units a single kW generates per day in Gujarat across the year.

So a home using 360 units a month is running roughly 12 units a day, which points to a system of about 3 kW. A home at 600 units a month is nearer 4.5 to 5 kW. Look at a full year of bills rather than one month, because summer air-conditioning can double a household's consumption and sizing to a January bill will leave you short from March onwards.

Two practical limits then apply: the shadow-free roof area you actually have, and your sanctioned load with the discom. We reconcile all three before quoting.`,
  },
  {
    id: 'roof-space-needed',
    category: 'sizing-cost',
    q: 'How much roof space do I need?',
    a: `Budget roughly 80 to 100 sq ft of shadow-free roof per kW. So a typical 3 kW residential system needs about 250 to 300 sq ft, and a 5 kW system about 400 to 500 sq ft.

"Shadow-free" matters more than raw area — a water tank, parapet wall or neighbouring building that shades even part of a panel for a few hours will pull down the output of the whole string. Where terrace space is being actively used, we mount the array on an elevated structure so you keep the floor underneath.`,
  },
  {
    id: 'generation-in-gujarat',
    category: 'sizing-cost',
    q: 'How much electricity will a system generate here in Gujarat?',
    a: `Gujarat sits in one of the highest solar irradiance belts in India, which is the single biggest advantage of installing here. Averaged across the year, expect roughly 4 to 4.5 units per kW per day.

In practice that means a 3 kW system generates somewhere around 360 to 400 units a month. Output runs noticeably higher from March to May and dips during the monsoon weeks, so the right way to judge a system is on the annual total rather than on any single month's bill.`,
  },
  {
    id: 'installation-duration',
    category: 'sizing-cost',
    q: 'How long does installation take, and will it damage my roof?',
    a: `The physical installation of a typical residential system is a two to four day job once material is on site. The longer part of the calendar is the approval and metering process around it, not the work itself.

On an RCC roof the mounting structure is ballasted or chemically anchored, and every penetration — where one is needed at all — is sealed and waterproofed. On a sheet roof we clamp to the existing profile rather than drilling through it. Done properly there is no leakage, and the structure is engineered to sit within the roof's load limits with margin.

We survey the roof before quoting precisely so these decisions are made on evidence rather than assumption, and the structure design is part of what you are approving.`,
  },
  {
    id: 'finance-emi',
    category: 'sizing-cost',
    q: 'Can I finance the system instead of paying upfront?',
    a: `Yes. Rooftop solar for homes is financed by most public sector banks and several NBFCs, and PM Surya Ghar has specifically pushed low-interest collateral-free lending for residential systems up to 3 kW. Rates and tenures are set by the lender, not by us.

The reason financing works well for solar is that the asset pays the instalment. A correctly sized system removes most of a monthly bill, and for many households that saving is close to — sometimes above — the EMI on a five to seven year tenure. From the day the loan closes, the entire saving is yours for the remaining twenty-odd years of panel life.

Our EMI and ROI calculator lets you model this with your own bill, tenure and rate before you commit to anything.`,
  },
  {
    id: 'business-commercial',
    category: 'sizing-cost',
    q: 'Do you install for businesses and not just homes?',
    a: `Yes. Commercial and industrial rooftops are a large part of what we do across Gujarat, and the economics are usually stronger than residential because the tariff per unit is higher and daytime consumption lines up almost perfectly with generation.

The differences to be aware of: the PM Surya Ghar residential subsidy does not apply to commercial connections, sanctioned loads and metering arrangements are larger and take a little more coordination with PGVCL, and accelerated depreciation is generally available as a tax benefit — worth discussing with your accountant, as it often outweighs the subsidy a residential customer receives.

Sizing logic is otherwise the same: we work from your actual consumption pattern and available shadow-free roof.`,
  },

  /* ─────────────── On-Grid Systems ─────────────── */
  {
    id: 'on-grid-what-is-it',
    category: 'on-grid',
    q: 'What exactly is an On-Grid solar system?',
    a: `An On-Grid system is a rooftop array connected directly to the utility supply, with no battery in the middle. Your panels feed an inverter, the inverter feeds your house, and anything you are not consuming at that moment flows out to the grid through a bidirectional meter.

Because there is no battery, the system is simpler, cheaper, and has nothing that needs replacing halfway through its life. It is also the only configuration that receives the full residential subsidy on the whole system. For the large majority of homes and businesses on a reasonably reliable PGVCL supply, this is the correct choice.

The single trade-off is that it does not provide backup during an outage. If that matters to you, a Hybrid system is the answer.`,
  },
  {
    id: 'on-grid-power-cut',
    category: 'on-grid',
    q: 'Will my solar system keep running during a power cut?',
    a: `An On-Grid system will not. When grid supply fails, the inverter shuts down automatically — a mandatory safety feature called anti-islanding that stops your system from energising a line that a discom engineer may be working on.

If backup during outages is what you need, that requires a Hybrid system with battery storage, which keeps your essential circuits live while remaining grid-connected the rest of the time. It costs more, and the battery portion is generally outside the subsidy, so it is worth being clear about which problem you are solving before choosing.`,
  },
  {
    id: 'on-grid-what-is-included',
    category: 'on-grid',
    q: 'What equipment is included in an On-Grid installation?',
    a: `A complete system is more than panels. You are getting the solar modules, a grid-tied inverter, the mounting structure, DC and AC cabling, DC and AC distribution boxes with protection devices, earthing, lightning protection, and the interconnection up to your meter position.

We quote and install all of it as one scope, including the earthing and surge protection that cheaper quotations often leave out. Those components are not optional in a coastal, high-irradiance environment — they are what stops a lightning event or an earth fault from taking out an inverter that costs more than the rest of the balance of system.

The bidirectional meter itself is supplied and installed by PGVCL as part of the net metering process, not by us.`,
  },
  {
    id: 'on-grid-warranty',
    category: 'on-grid',
    q: 'What warranties come with the system?',
    a: `Panels carry a 27-year performance warranty from the manufacturer — that is a guarantee about output over time, not merely against defects. Grid-tied inverters on our On-Grid systems carry a 10-year warranty. On Hybrid systems the inverter warranty is typically 5 years and the battery 5 years.

Two things worth understanding. First, these are manufacturer warranties, which is exactly why we specify established brands — Waaree, UTL, Adani, Polycab and similar — rather than whatever is cheapest that quarter. A 27-year warranty is worth what the company behind it is worth. Second, warranty on the workmanship and structure is ours, and it is separate from the product warranties.

You receive all warranty documentation at handover, along with the commissioning report.`,
  },
  {
    id: 'on-grid-brands',
    category: 'on-grid',
    q: 'Which panel and inverter brands do you use?',
    a: `For panels we work with Waaree, UTL and Adani, in both TOPCon and bifacial variants, typically in the 540 W to 620 W range depending on the model. For grid-tied inverters we work with UTL Solar, Solaryaan and Polycab.

We are not tied to a single manufacturer, which means the specification follows the site rather than the other way round. Bifacial modules, for instance, earn their premium on an elevated structure with a reflective surface beneath and are largely wasted flush against a dark roof.

If you have a brand preference, tell us at quotation stage and we will price it. If you have been quoted a brand you have not heard of by someone else, ask how long the manufacturer has been operating in India — a panel warranty only outlives the company that wrote it in theory.`,
  },

  /* ─────────────── Hybrid & Battery Backup ─────────────── */
  {
    id: 'hybrid-what-is-it',
    category: 'hybrid',
    q: 'What is a Hybrid system and how does it differ from On-Grid?',
    a: `A Hybrid system does everything an On-Grid system does — generates, self-consumes, exports surplus — and adds a battery bank plus an inverter capable of running independently of the grid.

In normal operation it behaves like an On-Grid system, so you still get the bill reduction and the export credits. The difference shows up the moment the grid drops: instead of shutting down, the inverter isolates your home from the grid and keeps your circuits running off solar and stored energy. The changeover is fast enough that lights and fans do not visibly interrupt.

You are paying for the battery bank, a more capable inverter, and the switching hardware. Whether that is worth it comes down to how often your supply fails and what an outage actually costs you.`,
  },
  {
    id: 'hybrid-backup-duration',
    category: 'hybrid',
    q: 'How long will the battery run my home during an outage?',
    a: `That depends entirely on how much you have stored and what you are running, and it is worth doing the arithmetic rather than trusting a headline number.

A 5 kWh usable battery running a light load — LED lighting, fans, router, television, roughly 500 W — will hold up for something like eight to ten hours. Add a 1.5 tonne air conditioner drawing around 1,500 W and the same battery is down to roughly three hours. A domestic borewell pump or an induction hob will empty it far faster.

This is why we size backup against a defined "essential load" list rather than your whole house. You decide which circuits must stay live, we size the bank to carry those for the duration you want, and everything else drops out during an outage. That approach is far more economical than trying to back up an entire home.`,
  },
  {
    id: 'hybrid-battery-type',
    category: 'hybrid',
    q: 'Lead-acid or lithium — which battery should I choose?',
    a: `Lead-acid costs materially less upfront and remains a reasonable choice where budget is the binding constraint and outages are occasional. The trade-offs are real, though: you can only use around half the rated capacity without shortening life, it is heavy and bulky, it charges more slowly, and it will need replacing sooner.

Lithium costs more per kWh at purchase but you can use most of the rated capacity, it accepts a much faster charge — which matters when a cloudy monsoon day gives you a narrow charging window — it takes far less floor space, and it lasts substantially longer. Measured across the life of the system rather than at the moment of purchase, lithium is usually the cheaper option.

Our Hybrid range supports both, in 48 VDC configurations in 5 kWh multiples. We will price both against your actual backup requirement so the comparison is concrete.`,
  },
  {
    id: 'hybrid-add-battery-later',
    category: 'hybrid',
    q: 'Can I add a battery to my existing On-Grid system later?',
    a: `Not by simply bolting one on. A standard grid-tied inverter has no capacity to charge a battery or to run islanded from the grid, so adding storage means replacing the inverter with a hybrid unit — which is the single most expensive component after the panels themselves.

Your panels, mounting structure and most of the DC side carry over, so it is not a complete write-off, but you are paying twice for the inverter. There is also a second route: a separate AC-coupled battery system alongside the existing inverter. That avoids replacing what you have but adds its own hardware cost and complexity.

The practical advice is to decide about backup before you buy, not after. If you think you will want it within a few years, a Hybrid inverter now — even with a small battery bank you expand later — is considerably cheaper than converting afterwards.`,
  },
  {
    id: 'hybrid-subsidy',
    category: 'hybrid',
    q: 'Is a Hybrid system eligible for the subsidy?',
    a: `Partly. The residential subsidy is calculated on the solar generating capacity — the panels and the inverter — so a Hybrid system does attract support on that portion. The battery bank is generally treated as outside the subsidised scope.

The consequence is that the subsidy covers a smaller share of a Hybrid system's total cost than it does of an equivalent On-Grid system, because the battery is precisely the part that makes Hybrid more expensive. A 3 kW On-Grid installation may see ₹78,000 against a comparatively modest total; the same ₹78,000 against a battery-backed system is a thinner slice.

Because the treatment of storage under the scheme has moved before and may again, we confirm the current position at quotation stage rather than relying on what was true last year.`,
  },
  {
    id: 'hybrid-battery-life',
    category: 'hybrid',
    q: 'How long do the batteries last, and what does replacement cost?',
    a: `Expect broadly five to seven years from a well-maintained lead-acid bank, and ten years or more from a good lithium bank. Manufacturer warranty on the batteries in our Hybrid systems is typically 5 years.

Battery life is measured in charge cycles, not calendar years, so usage pattern is what really determines it. A bank that discharges deeply every single day ages far faster than one that sits at full charge and is called on during occasional outages. Heat is the other major factor, which in Gujarat is a genuine consideration — batteries should be installed in a ventilated, shaded location, never in an unventilated enclosure against a west-facing wall.

Replacement should be planned for in the total cost of ownership from the outset. It is the main reason a Hybrid system's lifetime cost sits above an On-Grid system's, and any honest comparison of the two has to include it.`,
  },

  /* ─────────────── Net Metering & Billing ─────────────── */
  {
    id: 'net-metering-how-it-works',
    category: 'net-metering',
    q: 'How does net metering actually work in Gujarat?',
    a: `Your rooftop system is connected through a bidirectional meter supplied by the discom — across western Gujarat that is PGVCL. During the day the system feeds your own load first, and anything left over is exported to the grid. At night, or on cloudy days, you draw from the grid as usual.

At the end of each billing cycle you are charged only on the net difference between units imported and units exported. If you exported more than you imported, the surplus units are carried forward as a credit to the next cycle, and any balance left at the end of the settlement year is paid out at the rate approved by GERC.`,
  },
  {
    id: 'net-metering-bidirectional-meter',
    category: 'net-metering',
    q: 'What is a bidirectional meter and who installs it?',
    a: `An ordinary energy meter counts in one direction only. A bidirectional meter records import and export as two separate registers, which is what makes net billing possible — without it there is no way to prove how many units you sent back.

It is supplied, installed, sealed and owned by PGVCL, not by us and not by you. It goes in after your installation is complete and has passed inspection, and the charge for it appears through the discom's own process. No solar installer can fit this meter themselves; anyone offering to has misunderstood the process.

Until that meter is in place your system may generate, but you will not be credited for anything you export — which is why we push to get the application in early rather than treating it as an afterthought.`,
  },
  {
    id: 'net-metering-surplus-units',
    category: 'net-metering',
    q: 'What happens to surplus units I never use?',
    a: `Surplus rolls forward. If in a given billing cycle you export more than you import, the excess is not lost — it is carried into the next cycle as a unit credit and offsets what you draw then. This is what carries a well-sized system through the monsoon on credits banked in April and May.

At the close of the settlement year, any credit still unused is settled in cash at the rate approved by GERC. That rate is materially lower than the retail rate you pay for a unit you import, which has a practical implication worth understanding: a unit you consume yourself is worth considerably more to you than a unit you export and later sell back.

That asymmetry is exactly why we size against your actual consumption rather than filling every square foot of available roof. A grossly oversized system spends its life selling units cheaply.`,
  },
  {
    id: 'net-metering-zero-bill',
    category: 'net-metering',
    q: 'Will my electricity bill actually become zero?',
    a: `The energy charge on your bill can fall close to zero with a correctly sized system — we model around a 95% reduction — but the bill itself will not read zero, and you should be sceptical of anyone who promises it will.

What remains are the fixed components: the fixed or demand charge tied to your sanctioned load, along with applicable duties and levies. These are charges for being connected to the grid at all, and they apply whether you draw a single unit or not. On a residential connection they are a modest amount, but they are not nil.

There is a fair way to look at this. You are still connected to a network that acts as your battery — absorbing your surplus by day and supplying you at night — and the fixed charge is what that service costs. It is a good deal at the price.`,
  },
  {
    id: 'net-metering-system-size-limit',
    category: 'net-metering',
    q: 'Can I install a system larger than my sanctioned load?',
    a: `Not without addressing the sanctioned load first. Net metering rules cap the capacity you may connect in relation to the load sanctioned on your connection, and PGVCL will not approve an application that exceeds the permitted ratio.

If your consumption genuinely justifies a larger array, the route is to apply for an enhancement of sanctioned load and then size the system against the revised figure. That is a routine application, but it needs to happen before the solar approval rather than after, and it may carry its own charges and a change to your fixed charge.

We check your sanctioned load against your target system size at survey, precisely so this surfaces at the start. Discovering a capacity cap after the panels are on the roof is an expensive way to learn about it.`,
  },
  {
    id: 'net-metering-selling-house',
    category: 'net-metering',
    q: 'What happens to the system and the net metering if I sell my house?',
    a: `The physical system stays with the property — it is fixed to the roof and wired into the building's supply, and it transfers with the sale like any other fixture.

The net metering arrangement is tied to the electricity connection, so it follows the connection when ownership is transferred. The buyer needs to complete the discom's standard name-change process, and the net metering agreement is updated in the new consumer's name as part of that. It is administrative rather than difficult, but it does need doing — an agreement left in a former owner's name causes problems at settlement time.

Worth knowing for the seller: a commissioned rooftop system with documented generation history and transferable warranties is a genuine selling point, because the buyer inherits two decades of reduced bills without any of the capital outlay.`,
  },

  /* ─────────────── PGVCL Process & Compliance ─────────────── */
  {
    id: 'pgvcl-approvals-needed',
    category: 'pgvcl',
    q: 'What approvals do I need from PGVCL before installing?',
    a: `Rooftop solar with net metering is a permissioned activity, not something you may simply install and connect. The sequence is: register the application, obtain technical feasibility approval from PGVCL confirming your connection and the local network can accept the proposed capacity, install only after that approval, then apply for inspection and metering.

Feasibility is the step people underestimate. PGVCL is assessing your sanctioned load, the phase of your connection, and whether the distribution transformer serving you has headroom for the additional capacity. A refusal at this stage is usually about network capacity rather than anything to do with you.

We handle the registration and the discom correspondence as part of our scope. What we need from you is documentation and signatures, promptly — that is generally what determines whether the process runs quickly or slowly.`,
  },
  {
    id: 'pgvcl-timeline',
    category: 'pgvcl',
    q: 'How long does the whole process take end to end?',
    a: `Physical installation is only a few days. The end-to-end timeline — application through to a sealed bidirectional meter — commonly runs to several weeks, and it is dominated by the approval and metering steps rather than by any work on your roof.

Broadly: registration and feasibility approval first, then installation once approved, then inspection, then meter installation and the net metering agreement. Each stage depends on discom scheduling, and the queue is longer during periods of high scheme uptake, which the subsidy has produced.

We give a realistic date range at quotation rather than an optimistic one. Anyone promising a guaranteed completion date is promising something outside their control, because the discom's calendar is not ours. What we can control is that your file is complete and correct the first time, which is the single biggest avoidable source of delay.`,
  },
  {
    id: 'pgvcl-documents',
    category: 'pgvcl',
    q: 'What documents do I need to provide?',
    a: `The core set is a recent electricity bill for the connection the system will serve, proof of identity and address for the consumer, proof of ownership or a no-objection certificate from the owner if you are not one, bank account details for the subsidy credit, and photographs of the site and roof.

Two details cause the most trouble in practice. First, the connection must be in the name of the person applying — a bill still in a deceased parent's or a previous owner's name has to be transferred before the solar application can proceed, and that transfer is its own timeline. Second, the bank account provided for the subsidy must belong to the same consumer and be correctly linked, or the credit will fail at the last step.

Sorting both of these at the start rather than at the end saves weeks. We flag them at survey.`,
  },
  {
    id: 'pgvcl-sanctioned-load',
    category: 'pgvcl',
    q: 'Do I need to change my connection or sanctioned load?',
    a: `Often not, but it has to be checked rather than assumed. Two things can force a change: a proposed system larger than your sanctioned load permits, or a single-phase connection where the system size really calls for three-phase.

Single-phase connections are typically fine for smaller residential systems. Above that, or where you are running three-phase equipment, a three-phase connection becomes necessary — and converting is a separate discom application with its own cost and timeline.

Enhancing sanctioned load is routine, but it may increase the fixed charge on your bill, since that component is tied to sanctioned load. We work this out before quoting so the running-cost implication is visible upfront, rather than arriving as a surprise on the first bill after commissioning.`,
  },
  {
    id: 'pgvcl-inspection',
    category: 'pgvcl',
    q: 'What happens at the inspection, and what are they checking?',
    a: `After installation, the discom inspects before releasing the bidirectional meter. This is a safety and compliance check, not a judgement on how tidy the array looks.

They are verifying that the installed capacity matches what was approved, that earthing is correctly done and measured, that isolation and protection devices are in place and accessible, that the inverter carries valid certification and correctly implements anti-islanding, and that the interconnection at the meter position is safe and properly labelled. On subsidised systems they will also confirm the panels are the DCR-compliant models declared in the application.

A system built to standard passes. The failures we see elsewhere are almost always inadequate earthing, missing protection devices, or installed capacity that quietly differs from the approved figure. We build to pass the first time and attend the inspection with you.`,
  },

  /* ─────────────── PM Surya Ghar & Subsidy ─────────────── */
  {
    id: 'subsidy-how-much',
    category: 'subsidy',
    q: 'What subsidy do I actually receive under PM Surya Ghar?',
    a: `For residential rooftop systems the central subsidy is ₹30,000 for 1 kW, ₹60,000 for 2 kW, and ₹78,000 for 3 kW and above — ₹78,000 is the ceiling, so a 5 kW system receives the same amount as a 3 kW one.

To qualify, the system must use DCR-compliant (domestically manufactured) panels and be installed by a vendor registered on the national portal. The money is not deducted at the time of purchase: you pay for the system, and after installation and discom inspection the subsidy is credited directly to your bank account. We register the application and handle the discom paperwork for you.`,
  },
  {
    id: 'subsidy-when-paid',
    category: 'subsidy',
    q: 'When exactly does the subsidy money reach me?',
    a: `After commissioning, not before. The order of events is: you pay for the system, installation completes, the discom inspects and installs the bidirectional meter, the commissioning details are submitted on the national portal with your bank details, and the subsidy is then credited directly to that account.

The gap between commissioning and credit is commonly a few weeks, though it depends on portal processing and verification volumes at the time. It is a direct bank transfer — no cheque, no adjustment against a bill, and no intermediary.

Be wary of anyone offering to "give you the subsidy upfront" as a discount. The scheme does not work that way, and an installer who has priced a discount against a subsidy they cannot control has simply moved the risk to you. Our estimates show the subsidy deducted so you can see the net figure, but the payment mechanism is exactly as described here.`,
  },
  {
    id: 'subsidy-dcr-panels',
    category: 'subsidy',
    q: 'What are DCR panels and why do they matter?',
    a: `DCR stands for Domestic Content Requirement. A DCR-compliant panel is one where both the cells and the modules are manufactured in India, which is a stricter condition than a module simply being assembled here from imported cells.

It matters because it is a hard eligibility condition for the residential subsidy. A system built with non-DCR panels can be a perfectly good system, and it may even be slightly cheaper — but it will not receive a rupee of subsidy, and that will not become apparent until the claim fails.

This is worth being blunt about, because it is a live risk when comparing quotations. If one quotation is noticeably cheaper than another, check whether the panels are DCR-compliant before concluding you have found a better deal. We declare DCR status explicitly on subsidised systems, and the models we install are verified against the approved list.`,
  },
  {
    id: 'subsidy-eligibility',
    category: 'subsidy',
    q: 'Am I eligible for the subsidy?',
    a: `The scheme is for residential consumers. In practice that means the connection must be a domestic one, you need to be the owner of the property or hold the owner's no-objection, the system must be installed on your own roof and connected to your own metered connection, and it must be net-metered through the discom.

The subsidy is available once per eligible residential connection — it is not a repeatable claim, and it does not stack with other central subsidy support for the same installation. Commercial, industrial and agricultural connections fall outside it entirely, though as noted elsewhere they generally have accelerated depreciation available instead.

Group housing societies and residential welfare associations are covered under a separate provision of the scheme for common-area systems, at a different rate from the individual household slabs.`,
  },
  {
    id: 'subsidy-free-units',
    category: 'subsidy',
    q: 'What are the 300 free units I keep hearing about?',
    a: `The headline framing of PM Surya Ghar is "free electricity up to 300 units a month" for participating households. It is worth being precise about what that means, because it is widely misread.

There is no allowance of 300 free units credited to your account. What the scheme does is subsidise a system large enough that a typical household's generation covers roughly that level of consumption — so the electricity is "free" in the sense that your own roof produces it, not in the sense that anyone is gifting you units.

The practical translation: a system in the 2 to 3 kW range in a high-irradiance location like Gujarat will generate broadly in that territory, and a household consuming around that much will see its energy charge fall close to zero. If you consume considerably more than 300 units a month, you will still have a bill for the excess unless you size the system to your real consumption.`,
  },
  {
    id: 'subsidy-registered-vendor',
    category: 'subsidy',
    q: 'Does it matter who installs the system for the subsidy?',
    a: `Yes, decisively. The subsidy is only payable where the installation has been carried out by a vendor registered on the national portal and the work has been declared through the official process. An unregistered installer cannot make you eligible retrospectively.

This is the single most common way households lose the subsidy: the system is fine, the panels are fine, but the installation was never registered properly on the portal, and the claim has nowhere to go. The paperwork is not an optional layer on top of the job — for a subsidised system it is part of the job.

We register the application, install as the declared vendor, submit the commissioning details, and stay with the file through to the credit landing in your account. If you are comparing quotations, ask each installer directly whether they will be the registered vendor on your portal application.`,
  },

  /* ─────────────── Maintenance & Performance ─────────────── */
  {
    id: 'maintenance-dust-salt',
    category: 'maintenance',
    q: 'Will dust and the salty coastal air damage my panels?',
    a: `Neither will damage a properly specified system, but both need to be planned for. Gujarat is dry and dusty, and a visible layer of dust can cost you 10 to 25 percent of your output. A rinse with plain water every two to three weeks through the dry season recovers almost all of it — no detergent, and preferably early morning or after sunset.

For sites closer to the coast, salt-laden air is the real corrosion risk. We specify hot-dip galvanised or aluminium mounting structures and panels carrying a salt-mist corrosion rating for those locations, rather than the standard structure used inland.`,
  },
  {
    id: 'maintenance-cleaning-how',
    category: 'maintenance',
    q: 'How should panels be cleaned, and how often?',
    a: `Every two to three weeks through the dry season is a sensible rhythm in Gujarat, and you can stretch that during the monsoon when rain does the work. The right way to judge is by looking: if you can see a dust film, you are losing output.

Use plain water and a soft brush or a squeegee on a pole. No detergent, no abrasive pads, and never a scraper — the anti-reflective coating on the glass is what you are protecting, and once it is scratched the loss is permanent. Wash early morning or after sunset, never onto hot glass in the middle of the day, because cold water on a panel at 60°C risks thermal stress on the glass.

Above all, do not walk on the panels. If the array is awkward to reach safely, that is a job for someone with the right access equipment rather than an improvised ladder.`,
  },
  {
    id: 'maintenance-degradation',
    category: 'maintenance',
    q: 'Do panels lose efficiency as they age?',
    a: `Yes, gradually and predictably. Modern modules typically lose a couple of percent in the first year as they stabilise, then somewhere around half a percent annually thereafter. That is why the panel warranty is a performance warranty running 27 years — the manufacturer is guaranteeing a minimum output at points along that curve, not merely that the glass will not break.

In practical terms, a panel producing 100 units today will still be producing in the region of 85 to 88 units after twenty-five years. The system does not stop working at the end of the warranty; it carries on at a slightly reduced output.

Inverters are the component that genuinely needs replacing within the system's life. Plan on one inverter replacement across the life of a solar array, and treat any comparison that ignores this as incomplete.`,
  },
  {
    id: 'maintenance-inverter',
    category: 'maintenance',
    q: 'What maintenance does the inverter need?',
    a: `Very little day to day, but it needs the right conditions. Mount it out of direct sun in a ventilated position, keep the airflow around it clear, and keep the vents free of dust — a blocked inverter runs hot, and heat is what kills electronics.

Check the display or app periodically. Most grid-tied inverters report daily and cumulative generation, and the fastest way to catch a problem is to notice output has dropped against what the same week produced last year. A fault that goes unnoticed for a month is a month of lost generation you cannot recover.

Expect an inverter to need replacing once during the array's life — typically somewhere past the ten-year mark, which is why the warranty term sits where it does. That is a normal, budgeted event rather than a system failure.`,
  },
  {
    id: 'maintenance-cyclone-wind',
    category: 'maintenance',
    q: 'What about cyclones and high winds — is the system safe?',
    a: `This is a fair question in Gujarat, and the answer is in the structure rather than the panels. Mounting structures are engineered to a specified wind loading, and for our region that specification has to reflect the coastal wind zone rather than a generic inland default. Fixing method, ballast or anchor design, panel clamp spacing and rail sizing all follow from it.

A properly engineered array rides out high winds. The failures that make the news are almost always under-specified structures, insufficient anchoring, or clamps spaced too widely to hold a panel down at its edges. This is not the place in a quotation to save money.

We would also strongly recommend adding the system to your property insurance once commissioned. It is a substantial roof-mounted asset, cover is inexpensive, and it addresses the residual risk that no amount of engineering removes.`,
  },
  {
    id: 'maintenance-monitoring',
    category: 'maintenance',
    q: 'How do I know if my system is underperforming?',
    a: `Compare like with like. Generation varies enormously by season, so this month against last month tells you very little — this month against the same month last year tells you a great deal.

The reference point is roughly 4 to 4.5 units per kW per day averaged across the year in Gujarat. If a 3 kW system is averaging noticeably under about 12 units a day over a sustained clear-weather period, something is worth investigating. The usual causes, in order of likelihood: dust on the panels, new shading that was not there at survey — a neighbour's construction, a grown tree, a newly installed water tank — a tripped string, or an inverter fault.

Do the cheap checks first. Clean the panels, look at the array at 9am and again at 3pm to see whether anything is casting a shadow, and check the inverter display for a fault code before assuming a component has failed.`,
  },
];

/* ── Integrity guards ─────────────────────────────────────────────────────
   These run at import time in development so a bad edit surfaces immediately
   rather than as a silently missing entry on the page. Vite strips the
   import.meta.env.DEV branch out of the production bundle. */
if (import.meta.env?.DEV) {
  const ids = FAQS.map((f) => f.id);
  const duplicates = ids.filter((id, i) => ids.indexOf(id) !== i);
  if (duplicates.length) {
    console.error('[faqData] duplicate FAQ ids:', [...new Set(duplicates)]);
  }

  const categoryIds = new Set(FAQ_CATEGORIES.map((c) => c.id));
  const orphaned = FAQS.filter((f) => !categoryIds.has(f.category));
  if (orphaned.length) {
    console.error(
      '[faqData] FAQs with an unknown category (they will not render):',
      orphaned.map((f) => `${f.id} -> ${f.category}`)
    );
  }

  const missingTop = TOP_FAQ_IDS.filter((id) => !ids.includes(id));
  if (missingTop.length) {
    console.error('[faqData] TOP_FAQ_IDS referencing non-existent FAQs:', missingTop);
  }
}

/** The Homepage teaser set, resolved in TOP_FAQ_IDS order. */
export const getTopFaqs = () =>
  TOP_FAQ_IDS.map((id) => FAQS.find((faq) => faq.id === id)).filter(Boolean);

/** FAQs bucketed by category, preserving FAQ_CATEGORIES order. Empty
 *  categories are dropped so a filtered search never renders a bare heading. */
export const groupFaqsByCategory = (faqs = FAQS) =>
  FAQ_CATEGORIES.map((category) => ({
    ...category,
    faqs: faqs.filter((faq) => faq.category === category.id),
  })).filter((group) => group.faqs.length > 0);

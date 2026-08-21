/**
 * Industry journal content for /blog.
 *
 * These are explainers written for Gurukrupa's audience, summarising sector
 * developments that the listed publications cover. `sourceName` / `sourceUrl`
 * point readers to that publication's own coverage as further reading — they are
 * NOT a claim that the publication wrote this piece. The article page renders
 * that distinction explicitly.
 *
 * Figures quoted (scheme outlays, subsidy slabs, policy dates) were accurate at
 * the time of writing. Verify against the primary source before republishing.
 *
 * `content` is a block array so the renderer needs no markdown dependency:
 *   { type: 'h2' | 'p' | 'ul', text?: string, items?: string[] }
 *
 * `image` is a photograph hot-linked from the Unsplash CDN at w=1600&q=80,
 * replacing the earlier generated SVGs. 1600px (up from 800px) is what keeps
 * the featured card and the article cover — both of which render close to
 * 800 CSS px on a desktop layout — crisp on 2x displays; at 800px they were
 * being upscaled and visibly soft. `auto=format` means real browsers are served
 * WebP/AVIF, so the delivered bytes stay well under the JPEG size even at the
 * larger dimension, and the grid thumbnails are downscaled by the browser. Every id below was checked against the CDN and visually reviewed
 * before use — plausible-looking "solar" ids on Unsplash resolve to wind farms,
 * car factories and, in one case, a pizza. If you swap one, look at it first.
 * All four render sites (Blog.jsx featured + grid, BlogPost.jsx cover +
 * related) set a navy container background, so a CDN failure degrades to a
 * brand-coloured panel rather than a broken-image icon.
 */

export const BLOG_POSTS = [
  {
    id: 1,
    slug: 'pm-surya-ghar-what-the-numbers-mean-for-a-gujarat-household',
    title: 'PM Surya Ghar: what the scheme actually means for a Gujarat household',
    category: 'Policy',
    date: 'Aug 06, 2026',
    readTime: '6 min read',
    // Installer fitting a module on a residential pitched roof — the exact
    // scenario the scheme funds.
    image: 'https://images.unsplash.com/photo-1624397640148-949b1732bb0a?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'economictimes.indiatimes.com',
    sourceUrl: 'https://economictimes.indiatimes.com/industry/renewables',
    excerpt:
      'The central rooftop subsidy scheme carries a ₹75,021 crore outlay and a one crore household target. Here is how the subsidy slabs, the free-units promise and the discom inspection actually work once you move past the headline.',
    content: [
      {
        type: 'p',
        text: 'PM Surya Ghar: Muft Bijli Yojana is the largest residential rooftop solar programme India has attempted. It was launched in February 2024 with an outlay of ₹75,021 crore and a stated target of one crore households. For a homeowner in Gujarat, though, the number that matters is not the outlay — it is what lands in your bank account, and when.',
      },
      { type: 'h2', text: 'The subsidy slabs, plainly' },
      {
        type: 'p',
        text: 'Central financial assistance for residential rooftop systems is structured in three steps:',
      },
      {
        type: 'ul',
        items: [
          '₹30,000 for a 1 kW system',
          '₹60,000 for a 2 kW system',
          '₹78,000 for 3 kW and above',
        ],
      },
      {
        type: 'p',
        text: 'The third slab is a ceiling, not a rate. A 5 kW or a 10 kW residential system receives the same ₹78,000 as a 3 kW one. This single fact changes how a household should think about sizing: past 3 kW, every additional kilowatt has to justify itself purely on generation and bill savings, because the subsidy has stopped growing.',
      },
      { type: 'h2', text: 'It is a reimbursement, not a discount' },
      {
        type: 'p',
        text: 'A persistent misunderstanding is that the subsidy is knocked off the invoice. It is not. The household pays for the system, and the subsidy is credited directly to the registered bank account after installation is complete and the distribution company has inspected and commissioned the plant.',
      },
      {
        type: 'p',
        text: 'That sequencing has a practical consequence: you need the full amount available up front, and you should plan for a gap of several weeks between paying and being reimbursed. The gap depends far more on discom inspection scheduling than on anything the installer controls.',
      },
      { type: 'h2', text: 'Eligibility conditions that actually disqualify people' },
      {
        type: 'ul',
        items: [
          'The connection must be residential. Commercial and industrial consumers are outside this scheme entirely.',
          'The system must use DCR-compliant modules — domestically manufactured cells and modules, not merely modules assembled in India.',
          'The installation must be done by a vendor registered on the national portal. Work done outside that channel does not become eligible retrospectively.',
          'One subsidy per eligible connection. A second system on the same connection does not draw a second grant.',
        ],
      },
      { type: 'h2', text: 'The 300 free units question' },
      {
        type: 'p',
        text: 'The scheme is publicised around households receiving up to 300 free units of electricity a month. Read carefully, that is a description of the outcome for a well-sized system under net metering, not a separate entitlement credited by the discom. A system generating roughly as much as you consume, settled against your import under net metering, is what produces a near-zero bill. Undersize the system and you will not see it.',
      },
      { type: 'h2', text: 'What we would tell a customer in Bhuj or Madhapar' },
      {
        type: 'p',
        text: 'Gujarat sits in one of the strongest irradiance belts in the country, which means the generation side of the equation is already working in your favour. Size the system against your actual annual consumption rather than against the subsidy ceiling, budget for the reimbursement lag, and confirm your installer is registered on the portal before any money changes hands. Those three decisions determine most of the financial outcome.',
      },
    ],
  },

  {
    id: 2,
    slug: 'almm-list-ii-and-what-domestic-cell-rules-mean-for-rooftop-prices',
    title: 'ALMM List-II: why domestic cell rules are reshaping rooftop pricing',
    category: 'Manufacturing',
    date: 'Jul 22, 2026',
    readTime: '7 min read',
    // Close-up of cell rows within a module — the layer ALMM List-II reaches.
    image: 'https://images.unsplash.com/photo-1545209463-e2825498edbf?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'economictimes.indiatimes.com',
    sourceUrl: 'https://economictimes.indiatimes.com/industry/renewables',
    excerpt:
      'India built module assembly capacity far faster than cell capacity. With ALMM List-II extending approved-list rules to solar cells, the domestic content requirement now reaches deeper into the supply chain — and DCR module prices reflect it.',
    content: [
      {
        type: 'p',
        text: 'The Approved List of Models and Manufacturers began as a procurement safeguard: for government-supported projects, modules had to come from an approved list of domestic manufacturers. That list — ALMM List-I — covers modules. The significant policy shift has been the extension of the same approach to the layer beneath, through ALMM List-II for solar cells, notified to take effect from 1 June 2026.',
      },
      { type: 'h2', text: 'Why the distinction between modules and cells matters' },
      {
        type: 'p',
        text: 'India scaled module assembly capacity very quickly. Assembly is comparatively straightforward: it is the process of laminating imported cells into finished panels. Cell manufacturing is the capital-intensive step, and domestic capacity there has lagged well behind module capacity for years.',
      },
      {
        type: 'p',
        text: 'The practical result was that a module could be described as domestically manufactured while being built almost entirely from imported cells. Extending approved-list requirements to cells closes that gap, and pushes the localisation requirement one layer further up the chain.',
      },
      { type: 'h2', text: 'The effect on what a rooftop customer pays' },
      {
        type: 'p',
        text: 'Because PM Surya Ghar carries a domestic content requirement, subsidised residential rooftop systems must use DCR modules. DCR modules have consistently traded at a premium to non-DCR modules, for the straightforward reason that the domestic supply pool is smaller and its input costs are higher.',
      },
      {
        type: 'p',
        text: 'Households therefore face a genuine trade-off that is worth stating openly: a DCR system costs more per kilowatt than a non-DCR system, but only the DCR route is eligible for central financial assistance. For most residential sizes the subsidy comfortably outweighs the premium. For a customer who is ineligible for subsidy anyway — a commercial connection, for instance — the calculation runs the other way entirely.',
      },
      { type: 'h2', text: 'What to watch over the next few quarters' },
      {
        type: 'ul',
        items: [
          'Whether domestic cell capacity additions keep pace with the demand that the rule creates, or whether supply tightness pushes DCR premiums wider.',
          'Whether the DCR premium compresses as more integrated manufacturers commission cell lines.',
          'How quickly the approved lists are updated, since procurement is restricted to listed models and delisting events can disrupt supply mid-project.',
        ],
      },
      { type: 'h2', text: 'The installer-side view' },
      {
        type: 'p',
        text: 'From where we sit, the operational consequence is inventory discipline. Quoting a subsidised residential system against a module that is not on the current approved list is a fast way to strand a customer between an installed plant and a rejected subsidy claim. Verifying listing status at the time of procurement — not at the time of quotation — has become part of the job.',
      },
    ],
  },

  {
    id: 3,
    slug: 'gujarat-net-metering-why-the-state-leads-residential-rooftop',
    title: 'Why Gujarat keeps leading India on residential rooftop solar',
    category: 'Gujarat',
    date: 'Jul 09, 2026',
    readTime: '6 min read',
    // Technician working on a metering/distribution panel — the discom-side
    // process the piece is actually about.
    image: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'indianexpress.com',
    sourceUrl: 'https://indianexpress.com/section/business/',
    excerpt:
      'Gujarat has held the top position in installed residential rooftop capacity for years. The reason is less about sunlight than about a net metering framework and a discom process that households can actually navigate.',
    content: [
      {
        type: 'p',
        text: 'Gujarat has consistently ranked first among Indian states for installed residential rooftop solar capacity. It is tempting to attribute that to irradiance, but irradiance alone does not explain it — Rajasthan and parts of Maharashtra receive comparable sunlight without comparable residential uptake. The difference is regulatory and administrative.',
      },
      { type: 'h2', text: 'A net metering framework households can rely on' },
      {
        type: 'p',
        text: 'Under the Gujarat Electricity Regulatory Commission framework, a rooftop system is connected through a bidirectional meter. Generation serves your own load first. Surplus is exported to the grid and credited against what you import, and you are billed on the net difference at the end of each cycle.',
      },
      {
        type: 'p',
        text: 'Where the balance is in your favour, surplus units carry forward as credit to the following cycle, and any balance remaining at the end of the settlement year is paid out at the rate approved by the Commission. The predictability of that arrangement is what makes a household willing to commit capital to a twenty-five year asset.',
      },
      { type: 'h2', text: 'Discom process, not just discom policy' },
      {
        type: 'p',
        text: 'Western Gujarat falls under Paschim Gujarat Vij Company Limited. Across the state, the distribution companies — PGVCL, MGVCL, UGVCL and DGVCL, alongside private licensees in the larger cities — have handled residential rooftop applications at volume for long enough that the workflow is genuinely routine: feasibility approval, installation, inspection, meter replacement, commissioning.',
      },
      {
        type: 'p',
        text: 'That matters more than it sounds. In states where each application is treated as an exception, the timeline is unpredictable and the subsidy reimbursement stretches out behind it. A routine process is the difference between a six week project and a six month one.',
      },
      { type: 'h2', text: 'The state scheme layered underneath' },
      {
        type: 'p',
        text: 'Gujarat ran its own residential rooftop programme well before the current central scheme, which built both installer capacity and household familiarity. By the time PM Surya Ghar arrived, the state already had a vendor base that knew the paperwork. Programmes do not scale on subsidy alone; they scale on the existence of people who can execute them.',
      },
      { type: 'h2', text: 'What this means locally' },
      {
        type: 'p',
        text: 'For a household in Gujarat the combination is unusually favourable: among the highest irradiance in the country, a settled net metering regime, and a discom that processes rooftop applications as routine business. The remaining variables are sizing, shading and component quality — which are engineering decisions, not policy ones.',
      },
    ],
  },

  {
    id: 4,
    slug: 'module-prices-oversupply-and-the-rooftop-buyer',
    title: 'Cheap modules, expensive mistakes: reading solar prices as a buyer',
    category: 'Market',
    date: 'Jun 18, 2026',
    readTime: '5 min read',
    // Modules at ground level, structure and framing visible — the components
    // the piece argues buyers should be scrutinising.
    image: 'https://images.unsplash.com/photo-1558449028-b53a39d100fc?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'moneycontrol.com',
    sourceUrl: 'https://www.moneycontrol.com/news/business/',
    excerpt:
      'Global module oversupply pushed panel prices to historic lows. But modules are a shrinking share of a rooftop project cost, and the components that now dominate the bill are the ones buyers scrutinise least.',
    content: [
      {
        type: 'p',
        text: 'Several years of aggressive global manufacturing expansion — overwhelmingly in China — produced module oversupply and drove panel prices to levels the industry had not previously seen. That is unambiguously good for anyone installing solar. It has also quietly changed the shape of a rooftop quotation.',
      },
      { type: 'h2', text: 'The module is no longer the project' },
      {
        type: 'p',
        text: 'When panels were the dominant line item, comparing quotations on price per watt of module was a reasonable shortcut. As module prices fell, the balance of system — inverter, mounting structure, cabling, protection devices, and labour — became a much larger share of the total. Comparing two quotes on module price alone now tells you very little about which system will be standing and performing in fifteen years.',
      },
      { type: 'h2', text: 'Where quality differences actually show up' },
      {
        type: 'ul',
        items: [
          'Inverter: the component most likely to need replacement within the system life, and the one that determines how much of your generation you actually capture.',
          'Mounting structure: in coastal and saline environments, structure specification is the difference between a twenty-five year asset and a ten year one.',
          'Cabling and protection: undersized DC cabling and inadequate surge protection are invisible on day one and expensive later.',
          'Workmanship: roof penetration and waterproofing failures cost more to remediate than the panels cost to buy.',
        ],
      },
      { type: 'h2', text: 'The DCR wrinkle for subsidised systems' },
      {
        type: 'p',
        text: 'Households buying under PM Surya Ghar do not have full access to the cheapest global modules, because subsidy eligibility requires domestic content. DCR modules carry a premium. For residential sizes the subsidy is generally larger than the premium, so the subsidised route still wins — but it does mean the headline global price falls do not pass through to residential buyers one-for-one.',
      },
      { type: 'h2', text: 'A practical way to compare quotations' },
      {
        type: 'p',
        text: 'Ask for the make and model of the inverter, the structure specification and its corrosion treatment, and the warranty terms separated into product warranty and performance warranty. A quotation that answers those three questions precisely is describing a different product from one that quotes a system price and a panel brand — even when the two numbers are close.',
      },
    ],
  },

  {
    id: 5,
    slug: 'green-open-access-commercial-industrial-solar',
    title: 'Green open access: how commercial consumers are cutting power costs',
    category: 'Commercial',
    date: 'Jun 02, 2026',
    readTime: '6 min read',
    // Aerial of a utility-scale array — the procurement scale open access opens
    // up beyond a single commercial roof.
    image: 'https://images.unsplash.com/photo-1497435334941-8c899ee9e8e9?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'economictimes.indiatimes.com',
    sourceUrl: 'https://economictimes.indiatimes.com/industry/renewables',
    excerpt:
      'The 2022 green open access rules lowered the eligibility threshold to 100 kW, bringing mid-sized commercial and industrial consumers into a market that was previously the preserve of large industry.',
    content: [
      {
        type: 'p',
        text: 'Commercial and industrial consumers pay materially higher tariffs than residential ones, and they consume most of their power during daylight hours. That combination makes solar a straightforward commercial proposition — which is why C&I has driven a large share of India rooftop additions without needing residential-style subsidy support.',
      },
      { type: 'h2', text: 'What the 2022 rules changed' },
      {
        type: 'p',
        text: 'The Electricity (Promoting Renewable Energy Through Green Energy Open Access) Rules, 2022 reduced the open access eligibility threshold to 100 kW for renewable energy. Before that, open access was realistically available only to large industrial consumers. Lowering the threshold brought a much wider band of mid-sized businesses — hospitals, hotels, cold storage, mid-scale manufacturing — into scope.',
      },
      { type: 'h2', text: 'Two routes, different risk profiles' },
      {
        type: 'p',
        text: 'A commercial consumer generally chooses between behind-the-meter rooftop and open access procurement from an offsite generator. They are not equivalent.',
      },
      {
        type: 'ul',
        items: [
          'Rooftop offsets consumption directly, avoids transmission and wheeling charges, and is limited by available roof area.',
          'Open access can procure at much larger scale than a roof allows, but exposes the buyer to wheeling charges, banking rules and cross-subsidy surcharges that vary by state and change over time.',
        ],
      },
      {
        type: 'p',
        text: 'For most mid-sized consumers the sensible sequence is to exhaust rooftop capacity first — it is the simplest and least regulated tranche of savings — and evaluate open access for the residual load.',
      },
      { type: 'h2', text: 'The accelerated depreciation point' },
      {
        type: 'p',
        text: 'Commercial buyers are outside PM Surya Ghar, which is a residential scheme. The offsetting advantage is that a business can claim accelerated depreciation on the asset, which for a profitable entity can materially shorten the effective payback. Any commercial evaluation that ignores the tax treatment is understating the return.',
      },
      { type: 'h2', text: 'Where this lands in Gujarat' },
      {
        type: 'p',
        text: 'Gujarat has a substantial industrial base alongside its residential demand, and the state irradiance applies equally to a factory roof and a house roof. For commercial operators here, the binding constraint is usually available shadow-free roof area and structural load capacity rather than the economics.',
      },
    ],
  },

  {
    id: 6,
    slug: 'battery-storage-becoming-the-grid-priority',
    title: 'Storage is becoming the constraint: batteries and the evening peak',
    category: 'Storage',
    date: 'May 15, 2026',
    readTime: '6 min read',
    // Grid substation plant. Unsplash has no credible battery-storage
    // photograph — every "BESS" candidate checked resolved to an EV charger or
    // a consumer device — and this piece is about the grid's ability to absorb
    // solar and ride the evening peak, so transmission plant is the honest
    // stand-in. Swap it if a real BESS image becomes available.
    image: 'https://images.unsplash.com/photo-1509390144018-eeaf65052242?auto=format&fit=crop&w=1600&q=80',
    sourceName: 'moneycontrol.com',
    sourceUrl: 'https://www.moneycontrol.com/news/business/',
    excerpt:
      'India has added solar capacity faster than it has added the flexibility to absorb it. Battery storage, supported by viability gap funding, is moving from a niche add-on to the central problem in grid planning.',
    content: [
      {
        type: 'p',
        text: 'Solar generates in the middle of the day. Indian demand peaks in the evening, after sunset. For years that mismatch was manageable because solar was a small share of the mix. As the share has grown, the mismatch has become the defining engineering problem of the transition.',
      },
      { type: 'h2', text: 'Why the duck curve arrived here too' },
      {
        type: 'p',
        text: 'The pattern is familiar from other high-solar grids: midday net demand falls sharply as solar floods the system, then rises steeply in the evening as solar drops off and residential load picks up. Managing that evening ramp with conventional thermal plants is expensive and inefficient, because those plants are being asked to cycle rather than run steadily.',
      },
      { type: 'h2', text: 'Storage support has become explicit policy' },
      {
        type: 'p',
        text: 'The government has backed battery energy storage systems through viability gap funding, recognising that storage economics did not close on their own at the point the grid needed them. Alongside that, global lithium-ion cell prices have fallen substantially over the past decade, which has done more for storage viability than any single policy instrument.',
      },
      { type: 'h2', text: 'What it means at the household level' },
      {
        type: 'p',
        text: 'Grid-scale storage does not change how a residential on-grid system works — an on-grid inverter still shuts down during an outage, by design, to protect line workers. But the same cost curve that is making grid batteries viable is what has made hybrid residential systems reasonable for households that specifically need outage backup.',
      },
      {
        type: 'p',
        text: 'The honest caveat is that batteries are generally outside the residential subsidy, so a hybrid system carries a real cost premium over on-grid. The right question is not whether storage is getting cheaper — it is — but whether backup is a problem you actually have. Households with reliable supply are usually better served by a well-sized on-grid system.',
      },
      { type: 'h2', text: 'The direction of travel' },
      {
        type: 'p',
        text: 'Tender activity for standalone and co-located storage has grown steadily, and storage is increasingly written into renewable procurement as a requirement rather than an option. For anyone planning a system today, the useful takeaway is that grid flexibility is being built out — which strengthens, rather than weakens, the case for exporting surplus under net metering.',
      },
    ],
  },
];

export const getPostBySlug = (slug) => BLOG_POSTS.find((post) => post.slug === slug);

export default BLOG_POSTS;

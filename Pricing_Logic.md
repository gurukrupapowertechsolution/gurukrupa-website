# Quotation Pricing Engine: Mathematical Breakdown

This document provides a plain-English explanation of how the Gurukrupa backend calculates estimates for On-Grid and Hybrid solar systems.

---

## Section 1: On-Grid System Calculation (Worked Example)

This section traces the exact mathematical steps the system took to arrive at a final estimated cost of **₹44,610**.

**Scenario Inputs:**
*   **System Type:** On-Grid
*   **Phase:** 1 Phase
*   **Peak Bill:** ₹10,000
*   **Bottom Bill:** ₹2,000

### Part A: Calculating Required Solar Capacity (Kilowatts)

1.  **Average the Bill:** `(10,000 + 2,000) / 2 = 6,000`
2.  **Add 10% Margin:** `6,000 + 600 = 6,600` (Average Light Bill)
3.  **Calculate Units Consumed:** `6,600 / 6 (Cost per unit) = 1,100 units`
4.  **Calculate Base Capacity:** `1,100 / 4.5 (Solar Generation Capacity factor) = 244.44`
5.  **Adjust for Phase and Billing Cycle:** For 1 Phase, the bill is generated every 60 days.
    `244.44 / 60 days = 4.074`
6.  **Add 15% Factor for 1 Phase:** `4.074 * 1.15 = 4.685 kW`

**Resulting System Size:** 4.685 kW

### Part B: Calculating the Final Price

1.  **Match to Pricing Tier:** The system size of 4.685 kW is rounded UP to the nearest available tier in the backend pricing table. The nearest tier above 4.685 kW is the **5 kW** tier.
    *   *5 kW Tier Base Price:* **₹23,500**
2.  **Apply Base Markup (20%):** A flat 20% markup is added to the tier price.
    *   `23,500 * 1.20 = 28,200`
    *   *Marked-up Tier Price:* **₹28,200**
3.  **Add Inverter Placeholder:** Currently, On-Grid inverters (UTL/Solaryaan/Polycab) do not have final pricing data configured in the system. A hardcoded placeholder is added instead.
    *   *Inverter Placeholder Cost:* **₹15,000**
4.  **Calculate 5% Core GST:** The 5% GST is applied ONLY to the marked-up tier price. It is not currently applied to the inverter placeholder.
    *   `28,200 * 0.05 = 1,410`
    *   *GST Amount:* **₹1,410**
5.  **Add House Wiring:** For On-Grid systems, the house wiring cost is currently set to zero.
    *   *Wiring Cost:* **₹0**

**Final Total Calculation:**
`28,200 (Marked-up Tier) + 15,000 (Inverter) + 1,410 (5% GST) + 0 (Wiring) = ₹44,610`

---

## Section 2: Hybrid System Calculation Logic

The logic for Hybrid systems uses a different pricing structure. Here is the step-by-step formula the backend uses to generate a Hybrid quote, listing all hidden fees, multipliers, and taxes.

### 1. Inverter / System Base Price
The backend looks up the price based on the required System Size (kW) and Phase. Currently, all Hybrid systems default to the **IP67 Series**. Systems 5kW or under default to 1 Phase, while systems above 5kW default to 3 Phase.
*   *Example Tiers:* 3kW (₹74,000), 5kW (₹95,000), 6kW (₹145,000), etc.
*   If the exact calculated kW isn't listed, it rounds UP to the nearest tier.

### 2. Base Cost Markup
A **20% markup** is applied directly to the Inverter tier price selected in Step 1.
*   *Formula:* `Inverter Base Price * 1.20`

### 3. Battery Cost
The system calculates the total battery cost based on the number of batteries required to hit the requested backup hours.
*   *Standard Battery:* 51.2V / 100Ah
*   *Battery Rate:* **₹66,240** per battery
*   *Formula:* `Number of Batteries * ₹66,240`
*   *Note:* The 20% markup is **NOT** applied to the battery cost.

### 4. Core GST (5%)
A 5% GST is applied to the combined total of the Marked-up Inverter and the Batteries.
*   *Formula:* `(Marked-up Inverter + Total Battery Cost) * 0.05`

### 5. House Wiring Extra
House wiring is calculated based on the system size, at a flat rate of **₹3,000 per kW**.
*   *Formula:* `System Size (kW) * 3,000`

### 6. Wiring GST (18%)
An 18% GST is applied exclusively to the house wiring cost.
*   *Formula:* `House Wiring Cost * 0.18`

### Final Hybrid Total Formula
**Total Cost** = `(Marked-up Inverter)` + `(Total Battery Cost)` + `(5% Core GST)` + `(House Wiring)` + `(18% Wiring GST)`

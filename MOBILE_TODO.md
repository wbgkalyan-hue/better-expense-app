# Mobile App — Features To Build

All features below exist on the dashboard and need to be replicated on the mobile app.
Follow the existing patterns: Expo Router file-based routing, `services/firestore.ts` for
data, encryption via `encryptDoc`/`decryptDoc`, and the existing screen style (FlatList +
Add modal/sheet).

---

## Firestore Service (`services/firestore.ts`)

Add CRUD functions for each new collection, mirroring the dashboard's `lib/firestore.ts`.
Use `encryptDoc` on write and `decryptDoc` on read for all sensitive fields.

- [ ] **RE-Investments** — collection `re_investments`
  - Sensitive fields: `purchasePrice`, `currentValue`, `monthlyRent`, `notes`
  - Functions: `getRealEstateInvestments(uid)`, `addRealEstateInvestment(data)`, `updateRealEstateInvestment(id, data)`, `deleteRealEstateInvestment(id)`

- [ ] **Insurance** — collection `insurance_policies`
  - Sensitive fields: `policyNumber`, `premium`, `coverageAmount`
  - Functions: `getInsurancePolicies(uid)`, `addInsurancePolicy(data)`, `updateInsurancePolicy(id, data)`, `deleteInsurancePolicy(id)`

- [ ] **Credit Cards** — collection `credit_cards`
  - Sensitive fields: `last4`, `creditLimit`, `outstandingBalance`, `minPayment`, `interestRate`
  - Functions: `getCreditCards(uid)`, `addCreditCard(data)`, `updateCreditCard(id, data)`, `deleteCreditCard(id)`

- [ ] **Loans** — collection `loans`
  - Sensitive fields: `principalAmount`, `outstandingAmount`, `interestRate`, `emiAmount`
  - Functions: `getLoans(uid)`, `addLoan(data)`, `updateLoan(id, data)`, `deleteLoan(id)`

- [ ] **Friends** — collection `friends`
  - Sensitive fields: `name`, `phone`, `email`
  - Functions: `getFriends(uid)`, `addFriend(data)`, `updateFriend(id, data)`, `deleteFriend(id)`

- [ ] **Partners** — collection `partners`
  - Sensitive fields: `name`, `company`, `phone`, `email`
  - Functions: `getPartners(uid)`, `addPartner(data)`, `updatePartner(id, data)`, `deletePartner(id)`

- [ ] **Friends Ledger** — collection `friends_ledger`
  - Sensitive fields: `amount`, `description`
  - Functions: `getFriendsLedger(uid)`, `addFriendsLedgerEntry(data)`, `updateFriendsLedgerEntry(id, data)`, `deleteFriendsLedgerEntry(id)`

- [ ] **Partners Ledger** — collection `partners_ledger`
  - Sensitive fields: `amount`, `description`
  - Functions: `getPartnersLedger(uid)`, `addPartnersLedgerEntry(data)`, `updatePartnersLedgerEntry(id, data)`, `deletePartnersLedgerEntry(id)`

- [ ] **Properties** — collection `properties`
  - Sensitive fields: `address`, `currentValue`, `purchasePrice`, `monthlyRent`, `monthlyEmi`
  - Functions: `getProperties(uid)`, `addProperty(data)`, `updateProperty(id, data)`, `deleteProperty(id)`

---

## Screens (`app/(tabs)/`)

Each screen should show summary cards at the top and a scrollable list below.
Add a floating `+` button or header button to open an add form (modal or new screen).

- [ ] `re-investments.tsx` — RE-Investments screen
  - Cards: Total Invested, Current Value, Total Gain/Loss, Monthly Rent
  - List: property name, location, type, current value

- [ ] `insurance.tsx` — Insurance Policies screen
  - Cards: Total Policies, Total Annual Premium, Total Coverage
  - List: policy name, insurer, type, premium, end date

- [ ] `credit-cards.tsx` — Credit Cards screen
  - Cards: Total Limit, Total Outstanding, Utilisation %
  - List: card name, bank, outstanding balance, due date

- [ ] `loans.tsx` — Loans screen
  - Cards: Total Principal, Total Outstanding, Total EMI/month
  - List: loan name, lender, type, outstanding, EMI

- [ ] `friends-ledger.tsx` — Friends Ledger screen
  - Cards: Net Position (lent − borrowed), Unsettled Total
  - List: friend name, type (lent/borrowed), amount, settled status
  - Action: mark entry as settled

- [ ] `partners-ledger.tsx` — Partners Ledger screen
  - Cards: Net Position, Unsettled Total
  - List: partner name, type (paid/received/shared), amount, settled status
  - Action: mark entry as settled

- [ ] `friends.tsx` — Friends contact list screen
  - Cards: Total Friends
  - List: name, phone, email
  - Link: tap a friend to view their ledger entries

- [ ] `partners.tsx` — Partners contact list screen
  - Cards: Total Partners
  - List: name, company, phone, email
  - Link: tap a partner to view their ledger entries

- [ ] `properties.tsx` — Properties screen
  - Cards: Total Portfolio Value, Owned vs Rented count
  - List: property name, type, category, current value, monthly rent/EMI

---

## Navigation (`app/(tabs)/_layout.tsx`)

- [ ] Add the 9 new screens to the tab layout with `href: null` (hidden from tab bar,
  accessible via navigation links from the **More** screen)
- [ ] Update `more.tsx` to include navigation links to all 9 new screens, grouped by
  category (Finance, Ledger, Entities)

### Suggested grouping in More screen

**Finance**
- RE-Investments → `/re-investments`
- Insurance → `/insurance`
- Credit Cards → `/credit-cards`
- Loans → `/loans`

**Ledger**
- Friends Ledger → `/friends-ledger`
- Partners Ledger → `/partners-ledger`

**Entities**
- Friends → `/friends`
- Partners → `/partners`

**Other**
- Properties → `/properties`

---

## Types

The TypeScript types are already defined in the **dashboard** repo under `types/`.
Copy or share the following types into the mobile app (e.g. `types/` folder):

- [ ] `RealEstateInvestment`, `RealEstateInvestmentType` from `types/re-investment.ts`
- [ ] `InsurancePolicy`, `InsuranceType`, `InsuranceFrequency` from `types/insurance.ts`
- [ ] `CreditCard` from `types/credit-card.ts`
- [ ] `Loan`, `LoanType` from `types/loan.ts`
- [ ] `Friend`, `Partner` from `types/entity.ts`
- [ ] `FriendsLedgerEntry`, `PartnersLedgerEntry` from `types/ledger.ts`
- [ ] `Property`, `PropertyType`, `PropertyCategory` from `types/property.ts`

---

## Notes

- All monetary values must be displayed in **INR** format: `₹1,00,000`
- Encryption is already wired up in `services/encryption.ts` — just use `encryptDoc`/`decryptDoc`
- Follow the existing screen pattern in `goals.tsx` or `expenses.tsx` as a reference
- The `_encrypted: true` flag on Firestore docs is handled by `encryptDoc`/`decryptDoc` — no extra work needed

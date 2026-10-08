import {
  Baby,
  CalendarX,
  Check,
  ChevronDown,
  CigaretteOff,
  ClipboardList,
  Clock3,
  IdCard,
  PawPrint,
  ShieldCheck,
} from "lucide-react";
import { useState } from "react";
import { formatPolicyText, getHotelPolicies } from "../../utils/hotelPolicies.js";

import "./HotelPolicies.css";

const policyIcons = {
  checkInOut: Clock3,
  cancellation: CalendarX,
  children: Baby,
  pets: PawPrint,
  smoking: CigaretteOff,
  identification: IdCard,
  houseRules: ClipboardList,
  CHECK_IN_OUT: Clock3,
  CANCELLATION: CalendarX,
  CHILDREN_BEDS: Baby,
  PETS: PawPrint,
  SMOKING: CigaretteOff,
  HOUSE_RULES: ClipboardList,
};

function HotelPolicies({ hotel }) {
  const policyEntries = getHotelPolicies(hotel);
  const [openPolicy, setOpenPolicy] = useState(policyEntries[0]?.[0] || null);

  if (!policyEntries.length) return null;

  return (
    <section
      className="hotel-policies-section"
      id="policies"
      aria-labelledby="hotel-policies-title"
    >
      <div className="hotel-policies-heading">
        <span aria-hidden="true">12</span>
        <div>
          <h2 id="hotel-policies-title">Hotel Policies</h2>
          <p>
            Please review the important stay and reservation policies for {hotel.name}.
          </p>
        </div>
      </div>

      {policyEntries.length > 0 ? (
        <div className="hotel-policies-accordion">
          {policyEntries.map(([policyKey, policy]) => {
            const isOpen = openPolicy === policyKey;
            const PolicyIcon = policyIcons[policy.category] || policyIcons[policyKey] || ShieldCheck;
            const panelId = `policy-panel-${hotel.id}-${policyKey}`;

            return (
              <article
                className={`hotel-policy-item${isOpen ? " hotel-policy-item--open" : ""}`}
                key={policyKey}
              >
                <button
                  className="hotel-policy-trigger"
                  type="button"
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenPolicy((currentPolicy) =>
                      currentPolicy === policyKey ? null : policyKey,
                    )
                  }
                >
                  <span className="hotel-policy-icon" aria-hidden="true">
                    <PolicyIcon size={20} />
                  </span>
                  <span className="hotel-policy-copy">
                    <strong>{policy.title}</strong>
                    <small>{formatPolicyText(policy.summary, hotel)}</small>
                  </span>
                  <ChevronDown
                    className="hotel-policy-chevron"
                    aria-hidden="true"
                    size={19}
                  />
                </button>

                {isOpen && (
                  <div className="hotel-policy-panel" id={panelId}>
                    <ul>
                      {(Array.isArray(policy.details) ? policy.details : [policy.details]).flatMap((detail) => String(detail || '').split(/\n+/)).filter(Boolean).map(
                        (detail) => (
                          <li key={detail}>
                            <Check aria-hidden="true" size={14} />
                            {formatPolicyText(detail, hotel)}
                          </li>
                        ),
                      )}
                    </ul>
                    {policyKey === "cancellation" && (
                      <p>
                        Exact cancellation eligibility will be confirmed from the
                        reservation conditions.
                      </p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      ) : (
        <p className="hotel-policies-empty">
          Detailed policy information for this hotel will be available soon.
        </p>
      )}
    </section>
  );
}

export default HotelPolicies;

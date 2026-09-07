"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { submitAudit, SubmitState } from "./actions";
import PARTNERS from "@/data/partners.json";

const REF_STORAGE_KEY = "arma_ref_slug";

export default function Home() {
  const [activeRef, setActiveRef] = useState<string>("");
  const [typedReferrer, setTypedReferrer] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [area, setArea] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitState | null>(null);

  // ref comes from the URL on a referral visit; on a later direct visit we fall
  // back to the slug saved in localStorage so attribution survives, per partner.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const refParam = new URLSearchParams(window.location.search).get("ref");

    if (refParam) {
      setActiveRef(refParam);
      try {
        window.localStorage.setItem(REF_STORAGE_KEY, refParam);
      } catch {}
      return;
    }

    try {
      const stored = window.localStorage.getItem(REF_STORAGE_KEY);
      if (stored) setActiveRef(stored);
    } catch {}
  }, []);

  const knownPartnerName = activeRef ? (PARTNERS as Record<string, string>)[activeRef.toLowerCase()] : undefined;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await submitAudit(null, formData);
      setResult(response);
    });
  };

  return (
    <>
      <div className="top">
        <div className="wrap">
          <div className="brand">
            <Image src="/logo.png" alt="ARMA" width={526} height={120} priority />
          </div>
        </div>
      </div>

      <div className="hero">
        <div className="wrap hgrid">
          <div>
            <div className="eyebrow">Free market report</div>
            {knownPartnerName && (
              <div className="refbadge">
                <span className="dot"></span>
                <span>
                  Requested by <b>{knownPartnerName}</b>
                </span>
              </div>
            )}
            <h1>
              See who&apos;s taking your <span className="r">calls.</span>
            </h1>
            <p className="lede">
              We pull the real numbers for your area — how many people search for what you do, who&apos;s paying Google to reach them, and where you show up. Then <b>we get on a call and walk you through it,</b>{" "}
              so you&apos;re not left staring at a page of figures. The document is yours to keep either way.
            </p>
            <div className="metarow">
              <div>
                <b>Your area</b>Not a generic report
              </div>
              <div>
                <b>Built by hand</b>Not auto-generated
              </div>
              <div>
                <b>$0</b>No obligation, ever
              </div>
            </div>
          </div>

          <div>
            {result && result.success ? (
              <div className="card">
                <div className="done">
                  <h4>Got it.</h4>
                  <p>
                    We&apos;ll call within one business day to set a time. Your report gets built for that call — with your zip codes, your competitors, your numbers.
                  </p>
                </div>
              </div>
            ) : (
              <div className="card">
                <h2>Claim your market report</h2>
                <p className="cs">Takes about 30 seconds. We&apos;ll call to set a time.</p>

                <form onSubmit={handleSubmit}>
                  <input type="hidden" name="ref" value={activeRef} />

                  <div className="field">
                    <label htmlFor="website">Your business website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      placeholder="yourcompany.com"
                      required
                      autoComplete="url"
                      value={website}
                      onChange={(e) => setWebsite(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  <div className="field">
                    <label htmlFor="phone">Best phone number</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(512) 555-0134"
                      required
                      autoComplete="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      disabled={isPending}
                    />
                    <div className="hint">So we can set a time that works — we don&apos;t cold-call after that.</div>
                  </div>

                  <div className="field">
                    <label htmlFor="area">Areas you serve</label>
                    <input
                      id="area"
                      name="area"
                      type="text"
                      placeholder="City, or the zip codes you cover"
                      required
                      value={area}
                      onChange={(e) => setArea(e.target.value)}
                      disabled={isPending}
                    />
                    <div className="hint">The more exact, the more exact your report. Zip codes are ideal.</div>
                  </div>

                  <div className="field">
                    <label htmlFor="email">Where do we send the report?</label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="you@yourcompany.com"
                      required
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isPending}
                    />
                  </div>

                  {knownPartnerName ? (
                    <input type="hidden" name="referrer_typed" value={knownPartnerName} />
                  ) : (
                    <div className="field">
                      <label htmlFor="referrer">Who referred you?</label>
                      <input
                        id="referrer"
                        name="referrer_typed"
                        type="text"
                        placeholder="Company or person who sent you"
                        required
                        value={typedReferrer}
                        onChange={(e) => setTypedReferrer(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                  )}

                  <button className="submit" type="submit" disabled={isPending}>
                    {isPending ? "Sending..." : "Book my walkthrough"} &nbsp;&rarr;
                  </button>

                  {result && !result.success && <div className="error-message">{result.message}</div>}

                  <p className="trust">No spam &middot; No obligation &middot; Yours to keep</p>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>

      <section>
        <div className="wrap">
          <div className="k">How it works</div>
          <h3>Three steps. One of them is yours.</h3>
          <div className="steps">
            <div className="step">
              <div className="n">01</div>
              <h4>You tell us where you work</h4>
              <p>Website, phone, email, and the areas you cover. Thirty seconds — and that&apos;s the last thing we need from you.</p>
            </div>
            <div className="step">
              <div className="n">02</div>
              <h4>We build the report for your market</h4>
              <p>Your zip codes, your searches, your actual competitors — pulled from public Google data. Built by hand, not generated.</p>
            </div>
            <div className="step">
              <div className="n">03</div>
              <h4>We go through it with you</h4>
              <p>We walk you through what every number means and what we&apos;d do about it first. Then the document is yours, whatever you decide.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="inside">
        <div className="wrap">
          <div className="k">What&apos;s in it</div>
          <h3>Six things about your business you can&apos;t see from the inside.</h3>
          <p className="sublede">All of it from public Google data, so you can check every figure yourself.</p>
          <div className="ilist">
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>How many people search for what you do</b>
                <span>Every month, in your zip codes — with the exact search terms</span>
              </div>
            </div>
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>Who&apos;s paying Google to reach them right now</b>
                <span>Named competitors, and how long they&apos;ve been advertising</span>
              </div>
            </div>
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>What shows up when someone searches your company</b>
                <span>Often a competitor&apos;s ad sits above your own name</span>
              </div>
            </div>
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>Where you appear — and where you don&apos;t</b>
                <span>Paid results, Local Services Ads, and map listings</span>
              </div>
            </div>
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>Whether your site would hold up under more traffic</b>
                <span>Speed on a phone, how easy it is to call you, what you&apos;re not tracking</span>
              </div>
            </div>
            <div className="item">
              <span className="ck">&#10003;</span>
              <div>
                <b>The one thing costing you the most — and what to do first</b>
                <span>Three moves in priority order. Not a list of twenty problems</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="catch">
        <div className="wrap">
          <div className="k">The obvious question</div>
          <h3>So what&apos;s the catch?</h3>
          <div className="cgrid one">
            <div>
              <p>There isn&apos;t one, but there&apos;s a reason. We work with contractors — that&apos;s all we do. Some of the people we build these for end up hiring us, and that&apos;s why it&apos;s worth our time to do them properly.</p>
              <p>
                <b>The rest don&apos;t, and they keep the report.</b>{" "}
                We&apos;d rather show you something real than cold-pitch you on a call you didn&apos;t ask for.
              </p>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <Image src="/logo.png" alt="ARMA" width={526} height={120} />
        </div>
      </footer>
    </>
  );
}

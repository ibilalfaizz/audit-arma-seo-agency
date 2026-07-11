"use client";

import { useEffect, useState, useTransition } from "react";
import { submitAudit, SubmitState } from "./actions";

const PARTNERS: Record<string, string> = {
  miller: "Miller Digital",
  brightseo: "Bright SEO Co.",
  apexcrm: "Apex CRM Consulting",
};

export default function Home() {
  const [activeRef, setActiveRef] = useState<string>("");
  const [typedReferrer, setTypedReferrer] = useState<string>("");
  const [website, setWebsite] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<SubmitState | null>(null);

  // Read ref from URL search query on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const refParam = params.get("ref") || "";
      if (refParam) {
        setActiveRef(refParam);
      }
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setResult(null);

    const formData = new FormData(event.currentTarget);
    
    startTransition(async () => {
      const response = await submitAudit(null, formData);
      setResult(response);
    });
  };

  const handleReset = () => {
    setResult(null);
    setWebsite("");
    setEmail("");
    setTypedReferrer("");
    setActiveRef("");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("ref");
      window.history.replaceState({}, "", url.pathname);
    }
  };

  const referrerDisplayValue = activeRef ? (PARTNERS[activeRef] || activeRef) : typedReferrer;

  return (
    <>
      <div className="topbar">
        <div className="brand">
          <div className="mark">A</div>
          <div className="name">ARMA<em>.</em></div>
        </div>
        <div className="tr">
          <span className="g"></span> Live local data · updated in real time
        </div>
      </div>

      {/* ===== HERO : pitch left / form right (balanced) ===== */}
      <section className="hero">
        <div className="hero-in">
          <div className="left">
            <div className="eyebrow">
              <span className="tick"></span> Free Local Growth Audit
            </div>
            <h1>
              See who's taking your <span className="r">calls.</span>
            </h1>
            <p className="lede">
              A 6-page breakdown of your website, your local ranking, and the competitors booking the jobs that should be yours — the kind of audit agencies charge <b>$1,485</b> for. Built from your real data, in 24 hours.
            </p>
            <div className="why">
              <div className="q">What's the catch?</div>
              <p>
                About 1 in 5 businesses we audit hire us to fix what we find. We'd rather show you real value than cold-pitch you — the report's yours either way, no strings.
              </p>
            </div>
            <div className="meta">
              <span><b>6-page</b> report</span>
              <span><b>24h</b> turnaround</span>
              <span><b>No call</b> needed</span>
            </div>
          </div>

          <div className="formcol">
            <div className="card" id="card">
              {result && result.success ? (
                <div className="done">
                  <div className="ok">
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5"/>
                    </svg>
                    <span>You're all set</span>
                  </div>
                  <p>
                    Your audit for <b>{result.data?.website}</b> is being prepared &mdash; it'll reach {result.data?.email} within 24 hours.
                  </p>
                  <div className="pl">
                    <div><span className="k">site:  </span>&quot;{result.data?.website}&quot;</div>
                    {result.data?.ref ? (
                      <div>
                        <span className="k">ref:   </span>
                        <span className="rf">&quot;{result.data?.ref}&quot;</span>
                      </div>
                    ) : (
                      <div><span className="k">ref:   </span>null</div>
                    )}
                    {result.data?.referrer_typed && (
                      <div>
                        <span className="k">typed: </span>
                        &quot;{result.data?.referrer_typed}&quot;
                      </div>
                    )}
                    <span className="cap">
                      &uarr; The record that lands in your intake sheet. <b>ref</b> tells you which partner to pay &mdash; captured from the link automatically.
                    </span>
                  </div>
                  <button className="again" onClick={handleReset}>
                    &larr; Reset demo
                  </button>
                </div>
              ) : (
                <>
                  <h2>Claim your audit</h2>
                  <p className="cs">Enter your site — we build the report from your real numbers.</p>
                  
                  <form className="af" onSubmit={handleSubmit}>
                    {activeRef && (
                      <div className="f-ptag" id="ptag">
                        <span className="dot"></span>
                        <span>Referred by <b className="f-pname">{PARTNERS[activeRef] || activeRef}</b></span>
                      </div>
                    )}

                    <input type="hidden" name="ref" value={activeRef} />
                    
                    <div className="field">
                      <label htmlFor="website">Your business website</label>
                      <input
                        id="website"
                        name="website"
                        className="f-website"
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
                      <label htmlFor="referrer">Who referred you?</label>
                      <input
                        id="referrer"
                        name="referrer_typed"
                        className={`f-referrer ${activeRef ? "locked" : ""}`}
                        type="text"
                        placeholder="Company or person who sent you"
                        required
                        readOnly={!!activeRef}
                        value={referrerDisplayValue}
                        onChange={(e) => setTypedReferrer(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    
                    <div className="field">
                      <label htmlFor="email">Where do we send the report?</label>
                      <input
                        id="email"
                        name="email"
                        className="f-email"
                        type="email"
                        placeholder="you@yourcompany.com"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    
                    <button className="submit" type="submit" disabled={isPending}>
                      {isPending ? "Sending..." : "Send my free audit"} <span className="arw">&rarr;</span>
                    </button>
                    
                    {result && !result.success && (
                      <div className="error-message">
                        {result.message}
                      </div>
                    )}

                    <p className="trust">No spam &middot; No obligation &middot; No call required</p>
                  </form>
                </>
              )}
            </div>
            
            <div className="next">
              <div className="s">
                <div className="n">1</div>
                <div className="t">Enter your site &mdash; 20 seconds</div>
              </div>
              <div className="s">
                <div className="n">2</div>
                <div className="t">We benchmark you vs local competitors</div>
              </div>
              <div className="s">
                <div className="n">3</div>
                <div className="t">Report in your inbox within 24h</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== BREAKDOWN BAND (full width) ===== */}
      <section className="band">
        <div className="band-in">
          <div className="band-lead">
            <div className="k">What's inside &mdash; and what it's worth</div>
            <h3>
              A <span className="r">$1,485</span> audit. Yours free.
            </h3>
          </div>
          <div className="stack">
            <div className="stack-h">
              <span>Here's everything you get</span>
              <span>Agency price</span>
            </div>
            <div className="sl">
              <div className="txt">
                <span className="ck">&#10003;</span>
                <span className="nm">
                  Local ranking report
                  <small>Where you rank against nearby competitors</small>
                </span>
              </div>
              <span className="pr">$385</span>
            </div>
            <div className="sl">
              <div className="txt">
                <span className="ck">&#10003;</span>
                <span className="nm">
                  Profile + reviews audit
                  <small>The trust gaps losing you clicks</small>
                </span>
              </div>
              <span className="pr">$295</span>
            </div>
            <div className="sl">
              <div className="txt">
                <span className="ck">&#10003;</span>
                <span className="nm">
                  Speed + booking analysis
                  <small>Where visitors leave before calling</small>
                </span>
              </div>
              <span className="pr">$325</span>
            </div>
            <div className="sl">
              <div className="txt">
                <span className="ck">&#10003;</span>
                <span className="nm">
                  Competitor breakdown
                  <small>Who's ahead of you locally, and why</small>
                </span>
              </div>
              <span className="pr">$280</span>
            </div>
            <div className="sl">
              <div className="txt">
                <span className="ck">&#10003;</span>
                <span className="nm">
                  Priority action plan
                  <small>Exactly what to fix first</small>
                </span>
              </div>
              <span className="pr">$200</span>
            </div>
            <div className="total">
              <span className="lb">Total value</span>
              <span className="rt">
                <span className="was">$1,485</span>
                <span className="now">Free</span>
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

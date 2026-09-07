"use client";

import { useMemo, useState, useTransition } from "react";
import Image from "next/image";
import { slugify } from "@/lib/slugify";
import { createPartnerLink, logoutAdmin, CreatePartnerState } from "./actions";
import type { PartnerRecord } from "@/lib/partners-store";
import styles from "./admin.module.css";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function AdminClient({ initialPartners }: { initialPartners: PartnerRecord[] }) {
  const [partners, setPartners] = useState<PartnerRecord[]>(initialPartners);
  const [activeTab, setActiveTab] = useState<"new" | "all">("new");
  const [search, setSearch] = useState("");

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<CreatePartnerState | null>(null);
  const [copiedRowSlug, setCopiedRowSlug] = useState<string | null>(null);

  const origin = typeof window !== "undefined" ? window.location.origin : "https://audit.arma-agency.us";

  const effectiveSlug = slugTouched ? slug : slugify(name);
  const fullLink = `${origin}/?ref=${effectiveSlug}`;

  const filteredPartners = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return partners;
    return partners.filter((p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q));
  }, [partners, search]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugTouched) setSlug(slugify(value));
  };

  const handleSlugChange = (value: string) => {
    setSlugTouched(true);
    setSlug(value);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {}
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const response = await createPartnerLink(null, formData);
      setResult(response);

      if (response.success && response.record) {
        setPartners((prev) => [response.record!, ...prev]);
        setName("");
        setSlug("");
        setSlugTouched(false);
        await copyToClipboard(`${origin}/?ref=${response.record.slug}`);
      }
    });
  };

  const handleRowCopy = async (partnerSlug: string) => {
    await copyToClipboard(`${origin}/?ref=${partnerSlug}`);
    setCopiedRowSlug(partnerSlug);
    setTimeout(() => setCopiedRowSlug((current) => (current === partnerSlug ? null : current)), 1500);
  };

  return (
    <div className={styles.page}>
      <div className={styles.top}>
        <div className={styles.brand}>
          <Image src="/logo.png" alt="ARMA" width={526} height={120} className={styles.brandLogo} />
          <div className={styles.sep}></div>
          <div className={styles.sectionLabel}>Partner Links</div>
        </div>
        <form action={logoutAdmin}>
          <button className={styles.logoutBtn} type="submit">
            Log out
          </button>
        </form>
      </div>

      <div className={styles.wrap}>
        <h1 className={styles.h1}>Partner Links</h1>
        <p className={styles.sub}>Create a referral link for a new partner, or find one you&apos;ve already made.</p>

        <div className={styles.tabs}>
          <button
            type="button"
            className={activeTab === "new" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab("new")}
          >
            New Link
          </button>
          <button
            type="button"
            className={activeTab === "all" ? `${styles.tab} ${styles.tabActive}` : styles.tab}
            onClick={() => setActiveTab("all")}
          >
            All Links <span className={styles.count}>({partners.length})</span>
          </button>
        </div>

        {activeTab === "new" ? (
          <>
            {result?.success && result.record && (
              <div className={styles.toast}>
                <div className={styles.toastDot}>&#10003;</div>
                Link created for <b>&nbsp;{result.record.name}</b> &mdash; copied to clipboard.
              </div>
            )}
            {result && !result.success && <div className={styles.errorBox}>{result.error}</div>}

            <div className={styles.card}>
              <div className={styles.cardPad}>
                <form onSubmit={handleSubmit}>
                  <div className={styles.formrow}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="name">
                        Partner company name
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        className={styles.textInput}
                        placeholder="e.g. Hartley &amp; Co. Bookkeeping"
                        required
                        value={name}
                        onChange={(e) => handleNameChange(e.target.value)}
                        disabled={isPending}
                      />
                    </div>
                    <button className={styles.btn} type="submit" disabled={isPending || !effectiveSlug}>
                      {isPending ? "Creating..." : "Create Link"}
                    </button>
                  </div>

                  <label className={styles.label}>Link preview</label>
                  <div className={styles.previewbox}>
                    <div>
                      <div className={styles.previewLabel}>Slug — edit if it clashes with an existing one</div>
                      <div className={styles.previewUrl}>
                        {origin.replace(/^https?:\/\//, "")}/?ref=
                        <input
                          className={styles.slugInput}
                          name="slug"
                          value={effectiveSlug}
                          onChange={(e) => handleSlugChange(e.target.value)}
                          disabled={isPending}
                          aria-label="Slug"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.copybtn}
                      onClick={() => copyToClipboard(fullLink)}
                    >
                      ⧉ Copy link
                    </button>
                  </div>
                  <p className={styles.hint}>
                    The slug is generated automatically from the company name — lowercase, hyphens. You can edit it above before creating the link.
                  </p>
                </form>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className={styles.tblhead}>
              <h1 className={styles.h1} style={{ fontSize: 16, margin: 0 }}>
                All Links
              </h1>
              <input
                className={styles.search}
                type="text"
                placeholder="Search by company name…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className={styles.card}>
              <div className={styles.tableWrap}>
                {filteredPartners.length === 0 ? (
                  <div className={styles.empty}>No partner links yet.</div>
                ) : (
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th className={styles.th} style={{ width: "34%" }}>
                          Partner
                        </th>
                        <th className={styles.th} style={{ width: "42%" }}>
                          Link
                        </th>
                        <th className={styles.th} style={{ width: "24%" }}>
                          Created
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPartners.map((partner) => (
                        <tr className={styles.tr} key={partner.slug}>
                          <td className={`${styles.td} ${styles.co}`}>{partner.name}</td>
                          <td className={styles.td}>
                            <div className={styles.linkcell}>
                              <span className={styles.u}>
                                ?ref=<b>{partner.slug}</b>
                              </span>
                              <button
                                type="button"
                                className={styles.iconbtn}
                                onClick={() => handleRowCopy(partner.slug)}
                                aria-label="Copy link"
                              >
                                {copiedRowSlug === partner.slug ? "✓" : "⧉"}
                              </button>
                            </div>
                          </td>
                          <td className={`${styles.td} ${styles.datecell}`}>{formatDate(partner.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

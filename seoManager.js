import { currentFile, fs } from './state.js';
import { getNodeByPath } from './fileManager.js';

/* --- SEO and Accessibility Audit --- */

export function runSEO() {
  if(!currentFile || !currentFile.endsWith('.html')) {
    document.getElementById('seoReport').innerHTML = '<div class="text-blue-300">Open an HTML file to audit SEO and accessibility.</div>';
    return;
  }
  const node = getNodeByPath(currentFile);
  if(!node || node.type !== 'file') {
      document.getElementById('seoReport').innerHTML = '<div class="text-red-300">Cannot audit a non-file item.</div>';
      return;
  }
  const html = node.content;
  const seoReportDiv = document.getElementById('seoReport');
   if (!seoReportDiv) {
       console.error("SEO Report div not found!");
       return;
   }
   seoReportDiv.innerHTML = '<div class="text-blue-300">Running audit...</div>';

  const outputFrame = document.getElementById("outputFrame");
   if (!outputFrame || !outputFrame.contentWindow) {
        seoReportDiv.innerHTML = '<div class="text-red-300">Error: Output iframe not found or accessible. Cannot run audit.</div>';
        console.error("Output iframe not found or not accessible for SEO audit.");
        return;
   }

  try {
      outputFrame.contentWindow.document.open();
      outputFrame.contentWindow.document.write(html);
      outputFrame.contentWindow.document.close();
  } catch (e) {
       seoReportDiv.innerHTML = `<div class="text-red-300">Error rendering HTML in iframe: ${e.message}. Some content might be blocked by sandbox rules.</div>`;
       console.error("Error writing HTML to iframe:", e);
  }

  setTimeout(()=>{
    const report = runSEOChecks(outputFrame.contentWindow.document);
    seoReportDiv.innerHTML = report.join("");

    axe.run(outputFrame.contentWindow.document, {
      runOnly: ["wcag2a", "wcag2aa"],
      resultTypes: ["violations"],
    }).then(results=>{
      if(results.violations.length>0) {
        seoReportDiv.innerHTML += `<div class="mt-4 text-red-300"><b>Accessibility Violations:</b><ul class="list-disc pl-5">`+
          results.violations.map(v=>`<li>${v.help} - ${v.description} (${v.nodes.length} occurrence${v.nodes.length>1?'s':''})</li>`).join('')+
          '</ul></div>';
      } else {
        seoReportDiv.innerHTML += `<div class="mt-4 text-green-300"><b>Accessibility: </b>No violations found ✅</div>`;
      }
       seoReportDiv.innerHTML += `<div class="mt-2 text-blue-300 text-sm">Note: Audit performed within a sandboxed iframe, which may affect results for external resources or scripts.</div>`;

    }).catch(err => {
         console.error("Axe audit failed:", err);
         seoReportDiv.innerHTML += `<div class="mt-4 text-red-300">Accessibility audit failed: ${err.message}</div>`;
         seoReportDiv.innerHTML += `<div class="mt-2 text-blue-300 text-sm">Note: Audit performed within a sandboxed iframe, which may affect results for external resources or scripts.</div>`;
    });
  }, 250);
}

function runSEOChecks(doc) {
  if (!doc) {
      console.error("No document provided for SEO checks.");
      return [`<div class="text-red-400">Error: Could not access document for SEO checks.</div>`];
  }

  const links = Array.from(doc.querySelectorAll("a[href]"));
  const internalLinks = links.filter(a => a.getAttribute("href") && a.getAttribute("href").startsWith("/"));
  const externalLinks = links.filter(a => a.getAttribute("href") && /^https?:\/\//.test(a.getAttribute("href")));
  const h1Count = doc.querySelectorAll("h1").length;
  const h2Count = doc.querySelectorAll("h2").length;
  const h3Count = doc.querySelectorAll("h3").length;
  const h4Count = doc.querySelectorAll("h4").length;
  const h5Count = doc.querySelectorAll("h5").length;
  const h6Count = doc.querySelectorAll("h6").length;
  const htmlLang = doc.documentElement?.getAttribute("lang");
  const metaViewport = doc.querySelector('meta[name="viewport"]');
  const titleTags = Array.from(doc.querySelectorAll("title"));
  const metaDescTags = Array.from(doc.querySelectorAll('meta[name="description"]'));
  const favicon = doc.querySelector('link[rel="icon"]');
  const canonical = doc.querySelector('link[rel="canonical"]');
  const images = Array.from(doc.querySelectorAll("img"));

  const checks = [
    { label: "Title Tag", passed: !!doc.querySelector("title"), value: doc.querySelector("title")?.textContent?.substring(0, 60) || "Missing" },
    { label: "Duplicate Title Tags", passed: titleTags.length <= 1, value: `${titleTags.length} found` },
    { label: "Meta Description", passed: !!doc.querySelector('meta[name="description"]'), value: doc.querySelector('meta[name="description"]')?.content?.substring(0, 160) || "Missing" },
    { label: "Duplicate Meta Descriptions", passed: metaDescTags.length <= 1, value: `${metaDescTags.length} found` },
    { label: "Canonical Tag", passed: !!canonical, value: canonical?.href || "Missing" },
    { label: "Open Graph Title", passed: !!doc.querySelector('meta[property="og:title"]'), value: doc.querySelector('meta[property="og:title"]')?.content?.substring(0, 60) || "Missing" },
    { label: "Open Graph Description", passed: !!doc.querySelector('meta[property="og:description"]'), value: doc.querySelector('meta[property="og:description"]')?.content?.substring(0, 160) || "Missing" },
    { label: "Favicon", passed: !!favicon, value: favicon?.href ? 'Present' : "Missing" },
    { label: "Meta Robots", passed: !!doc.querySelector('meta[name="robots"]'), value: doc.querySelector('meta[name="robots"]')?.content || "Missing (implies index,follow)" },
    { label: "Structured Data (JSON-LD)", passed: !!doc.querySelector('script[type="application/ld+json"]'), value: !!doc.querySelector('script[type="application/ld+json"]') ? "Present" : "Missing" },
    { label: "Microdata (itemscope/itemtype)", passed: !!doc.querySelector('[itemscope][itemtype]'), value: !!doc.querySelector('[itemscope][itemtype]') ? "Present" : "Missing" },
    { label: "Viewport Meta Tag", passed: !!metaViewport && metaViewport.getAttribute("content")?.includes('width=device-width'), value: metaViewport?.getAttribute("content") || "Missing or incorrect" },
    { label: "<html lang>", passed: !!htmlLang && htmlLang.trim() !== '', value: htmlLang || "Missing" },
    { label: "One <h1> tag only", passed: h1Count === 1, value: `${h1Count} found` },
    { label: "Headings present (<h2>-<h6>)", passed: h2Count + h3Count + h4Count + h5Count + h6Count > 0, value: `h2: ${h2Count}, h3: ${h3Count}, h4: ${h4Count}, h5: ${h5Count}, h6: ${h6Count}` },
    { label: "Image alt tags", passed: images.every(img => img.alt != null && img.alt.trim() !== ''), value: `${images.filter(img => img.alt == null || img.alt.trim() === '').length} missing or empty out of ${images.length}` },
    { label: "Internal Links", passed: internalLinks.length > 0, value: `${internalLinks.length} found` },
    { label: "External Links", passed: externalLinks.length > 0, value: `${externalLinks.length} found` },
  ];

  return checks.map(check =>
    `<div class="${check.passed ? 'text-green-400' : 'text-red-400'} mb-1">
      ${check.passed ? "✅" : "❌"} <b>${check.label}:</b> ${check.value}
    </div>`
  );
}

window.runSEO = runSEO;

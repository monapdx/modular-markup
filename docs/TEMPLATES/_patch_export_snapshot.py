import pathlib

root = pathlib.Path(__file__).resolve().parent

old_try = """    btn.addEventListener("click", function () {
      try {
        var path = location.pathname || "";
        var m = path.match(/[^\\/]+$/);
        var base = (m && m[0]) ? m[0] : "page.html";
        base = base.replace(/\\.html$/i, "").replace(/\\.htm$/i, "");
        var filename = base + "-export.html";
        var markup = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
        var blob = new Blob([markup], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
          URL.revokeObjectURL(url);
        }, 2500);
      } catch (e) {
        window.alert("Export failed (some browsers block downloads from local files).");
      }
    });"""

new_try = """    btn.addEventListener("click", function () {
      try {
        var exportBar = document.querySelector(".mm-export-bar");
        if (exportBar && exportBar.parentNode) {
          exportBar.parentNode.removeChild(exportBar);
        }
        var path = location.pathname || "";
        var m = path.match(/[^\\\\/]+$/);
        var base = (m && m[0]) ? m[0] : "page.html";
        base = base.replace(/\\.html$/i, "").replace(/\\.htm$/i, "");
        var filename = base + "-export.html";
        var markup = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
        var blob = new Blob([markup], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(function () {
          URL.revokeObjectURL(url);
          if (typeof mmAttachExportHtmlButton === "function") {
            mmAttachExportHtmlButton();
          }
        }, 2500);
      } catch (e) {
        if (typeof mmAttachExportHtmlButton === "function") {
          mmAttachExportHtmlButton();
        }
        window.alert("Export failed (some browsers block downloads from local files).");
      }
    });"""

for p in sorted(root.glob("*.html")):
    if p.name.startswith("_"):
        continue
    t = p.read_text(encoding="utf-8")
    if old_try not in t:
        continue
    p.write_text(t.replace(old_try, new_try, 1), encoding="utf-8")
    print("updated export click", p.name)

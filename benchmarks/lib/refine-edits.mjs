// Controlled edits shared by the rendered comparison and native journey checks.
import fs from "node:fs";
import path from "node:path";

export function improve(cwd, id) {
  const edit = (file, fn) => {
    const target = path.join(cwd, "src", file), before = fs.readFileSync(target, "utf8"), after = fn(before);
    if (before === after) throw new Error(`Expected edit did not execute: ${id} ${file}`);
    fs.writeFileSync(target, after);
  };
  if (id === "E") {
    edit("components/Layout.jsx", (s) => s.replace("min-h-10 items-center gap-1.5", "min-h-11 min-w-11 justify-center items-center gap-1.5"));
    edit("pages/Dashboard.jsx", (s) => s.replace('<div className="overflow-x-auto">', '<div className="overflow-x-auto" tabIndex={0} role="region" aria-labelledby="line-title">'));
    return;
  }
  edit("components/Layout.jsx", (s) => s.replace("p-3 flex items-center", "p-3 flex flex-wrap items-center gap-3").replace('className="flex gap-4"', 'className="flex flex-wrap gap-x-4 gap-y-2"').replace('<div className="p-4">', '<main className="min-w-0 p-4">').replace('<Outlet />\n      </div>', '<Outlet />\n      </main>'));
  edit("components/Button.jsx", (s) => s.replace("px-3 py-1 rounded", "min-h-11 px-3 py-2 rounded"));
  if (id === "C") {
    edit("pages/Tickets.jsx", (s) => s.replace("flex gap-2 mb-4", "flex flex-wrap gap-2 mb-4"));
    edit("pages/Overview.jsx", (s) => s.replace("grid-cols-4", "grid-cols-2 sm:grid-cols-4").replace('className="flex gap-4"', 'className="flex flex-col gap-4 lg:flex-row"').replace('className="flex-1"', 'className="min-w-0 flex-1"').replace('className="w-1/3"', 'className="w-full lg:w-1/3"'));
    edit("pages/TicketDetail.jsx", (s) => s.replace('className="flex gap-6"', 'className="flex flex-col gap-6 md:flex-row"').replace('className="flex-1"', 'className="min-w-0 flex-1"').replace('className="w-64"', 'className="w-full md:w-64"'));
    edit("components/TicketTable.jsx", (s) => s.replace('<table className=', '<div className="max-w-full overflow-x-auto" role="region" aria-label="Tickets" tabIndex={0}><table className=').replace('</table>', '</table></div>'));
    edit("pages/Customers.jsx", (s) => s.replace('<table className=', '<div className="max-w-full overflow-x-auto" role="region" aria-label="Customers" tabIndex={0}><table className=').replace('</table>', '</table></div>'));
  } else {
    edit("components/Layout.jsx", (s) => s.replace("mr-6 text-lg font-bold", "inline-flex min-h-11 items-center mr-6 text-lg font-bold").replace("ml-auto bg-blue-600", "inline-flex min-h-11 items-center ml-auto bg-blue-600"));
    for (const file of ["pages/Home.jsx", "pages/Services.jsx"]) edit(file, (s) => s.replaceAll("grid-cols-3", "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3").replace("flex gap-2 mb-4", "flex flex-wrap gap-2 mb-4"));
    edit("pages/Book.jsx", (s) => s.replace('className="flex gap-6"', 'className="flex flex-col gap-6 md:flex-row"').replace('className="flex-1"', 'className="min-w-0 flex-1"').replace('className="w-64 ', 'className="w-full md:w-64 '));
  }
}

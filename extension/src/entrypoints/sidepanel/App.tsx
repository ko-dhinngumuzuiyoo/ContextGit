import { MemoryRouter, Routes, Route } from "react-router-dom";
import SidepanelLayout from "../../components/layout/SidepanelLayout";
import RepoListView from "../../views/RepoListView";
import RepoEditorView from "../../views/RepoEditorView";
import HistoryView from "../../views/HistoryView";
import ExportView from "../../views/ExportView";

export default function App() {
  return (
    <MemoryRouter>
      <SidepanelLayout>
        <Routes>
          <Route path="/" element={<RepoListView />} />
          <Route path="/repo/:id" element={<RepoEditorView />} />
          <Route path="/repo/:id/history" element={<HistoryView />} />
          <Route path="/repo/:id/export" element={<ExportView />} />
        </Routes>
      </SidepanelLayout>
    </MemoryRouter>
  );
}

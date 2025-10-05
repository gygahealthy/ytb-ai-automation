// ...existing code...

interface ProfileOption {
  id: string;
  name: string;
}

interface Props {
  profiles: ProfileOption[];
  selectedProfileId?: string;
  onChangeProfile: (id: string) => void;
  provider: "gemini" | "chatgpt";
  onChangeProvider: (p: "chatgpt" | "gemini") => void;
  onRun?: () => void;
}

export default function ChatToolbar({ profiles, selectedProfileId, onChangeProfile, provider, onChangeProvider, onRun }: Props) {
  return (
    <div className="flex items-center gap-3">
      <select
        value={selectedProfileId ?? ""}
        onChange={(e) => onChangeProfile(e.target.value)}
        className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <option value="">Select profile...</option>
        {profiles.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      <select
        value={provider}
        onChange={(e) => onChangeProvider(e.target.value as "chatgpt" | "gemini")}
        className="px-3 py-2 rounded-lg border bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <option value="chatgpt">ChatGPT</option>
        <option value="gemini">Gemini</option>
      </select>

      <button
        onClick={() => onRun && onRun()}
        className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white font-medium rounded-lg transition-colors"
      >
        Run
      </button>
    </div>
  );
}

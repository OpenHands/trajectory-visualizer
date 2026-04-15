import React, { useState } from 'react';
import { TrajectoryCard } from "../trajectory-card";
import { CMarkdown } from '../../markdown';

interface AgentContextProps {
  data: any;
  timestamp?: string;
  extra?: React.ReactNode;
}

interface Skill {
  name: string;
  content: string;
  description?: string;
  source?: string;
  trigger?: any;
}

export const AgentContextComponent: React.FC<AgentContextProps> = ({ data, timestamp, extra }) => {
  const [expandedSkills, setExpandedSkills] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');
  
  const agentContext = data?.value?.agent?.agent_context || data?.agent_context;
  const skills: Skill[] = agentContext?.skills || [];
  const model = data?.value?.agent?.llm?.model || data?.agent?.llm?.model || 'unknown';
  
  const toggleSkill = (skillName: string) => {
    setExpandedSkills(prev => ({
      ...prev,
      [skillName]: !prev[skillName]
    }));
  };

  // Filter skills based on search
  const filteredSkills = skills.filter(skill => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      skill.name?.toLowerCase().includes(query) ||
      skill.content?.toLowerCase().includes(query) ||
      skill.description?.toLowerCase().includes(query)
    );
  });

  // Highlight matching text
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
        : part
    );
  };

  if (!agentContext || skills.length === 0) {
    return null;
  }

  return (
    <TrajectoryCard
      className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800"
      originalJson={data}
      timestamp={timestamp}
    >
      <TrajectoryCard.Header className="bg-indigo-100 dark:bg-indigo-800/50 text-indigo-800 dark:text-indigo-100" extra={extra}>
        🧠 Agent Context
      </TrajectoryCard.Header>
      <TrajectoryCard.Body>
        <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
          <span className="font-medium">Model:</span> {model}
          <span className="mx-2">|</span>
          <span className="font-medium">Skills:</span> {skills.length}
        </div>
        
        {/* Search box */}
        <div className="mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search skills..."
            className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        {/* Skills list */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredSkills.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-400 text-sm py-2">
              No skills match "{searchQuery}"
            </div>
          ) : (
            filteredSkills.map((skill, idx) => (
              <div
                key={idx}
                className="border border-gray-200 dark:border-gray-700 rounded-md overflow-hidden"
              >
                <div
                  onClick={() => toggleSkill(skill.name)}
                  className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {highlightMatch(skill.name, searchQuery)}
                    </span>
                    {skill.description && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                        - {skill.description.slice(0, 60)}...
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-blue-500">
                    {expandedSkills[skill.name] ? '▼ Collapse' : '▶ Expand'}
                  </span>
                </div>
                
                {expandedSkills[skill.name] && (
                  <div className="p-3 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                    {skill.description && (
                      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Description:</span> {skill.description}
                      </div>
                    )}
                    {skill.source && (
                      <div className="mb-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-medium">Source:</span> {skill.source}
                      </div>
                    )}
                    <div className="mt-2 max-h-64 overflow-y-auto text-sm">
                      <CMarkdown>{skill.content || ''}</CMarkdown>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </TrajectoryCard.Body>
    </TrajectoryCard>
  );
};

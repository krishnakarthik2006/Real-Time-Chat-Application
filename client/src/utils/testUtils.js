// Testing utilities for the chat application

export const mockUser = {
  id: 1,
  name: "Test User",
  email: "test@example.com",
  avatarSeed: "test-seed",
};

export const mockConversation = {
  id: 1,
  name: "Test Conversation",
  type: "direct",
  participants: [mockUser],
  lastMessage: {
    id: 1,
    content: "Hello, world!",
    sender: mockUser,
    createdAt: new Date().toISOString(),
  },
  unreadCount: 0,
};

export const mockMessage = {
  id: 1,
  content: "Test message",
  sender: mockUser,
  createdAt: new Date().toISOString(),
  status: "sent",
  reactions: [
    { userId: 1, userName: "Test User", emoji: "❤️" },
    { userId: 2, userName: "Other User", emoji: "👍" },
  ],
};

export const mockSocket = {
  emit: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  connected: true,
};

// Helper functions for testing
export const createMockProps = (overrides = {}) => ({
  currentUser: mockUser,
  conversations: [mockConversation],
  messages: { [mockConversation.id]: [mockMessage] },
  selectedConversationId: mockConversation.id,
  presenceByUserId: { [mockUser.id]: { isOnline: true } },
  socket: mockSocket,
  onSendMessage: jest.fn(),
  onEditMessage: jest.fn(),
  onDeleteMessage: jest.fn(),
  ...overrides,
});

export const waitFor = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const flushPromises = () => new Promise(resolve => setImmediate(resolve));

export const mockApiResponse = (data, delay = 0) => {
  return new Promise(resolve => {
    setTimeout(() => resolve(data), delay);
  });
};

export const mockApiError = (message, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(message)), delay);
  });
};

// Performance testing utilities
export const measureRenderTime = (component, props, iterations = 100) => {
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    component(props);
    const end = performance.now();
    times.push(end - start);
  }
  
  return {
    average: times.reduce((a, b) => a + b, 0) / times.length,
    min: Math.min(...times),
    max: Math.max(...times),
    median: times.sort((a, b) => a - b)[Math.floor(times.length / 2)],
  };
};

export const measureMemoryUsage = () => {
  if ('memory' in performance) {
    return {
      used: performance.memory.usedJSHeapSize,
      total: performance.memory.totalJSHeapSize,
      limit: performance.memory.jsHeapSizeLimit,
    };
  }
  return null;
};

// Integration test helpers
export const setupMockSocketServer = () => {
  const clients = new Map();
  
  return {
    connect: (clientId) => {
      const client = {
        id: clientId,
        emit: jest.fn(),
        on: jest.fn(),
        off: jest.fn(),
        connected: true,
      };
      clients.set(clientId, client);
      return client;
    },
    
    disconnect: (clientId) => {
      const client = clients.get(clientId);
      if (client) {
        client.connected = false;
        clients.delete(clientId);
      }
    },
    
    broadcast: (event, data) => {
      clients.forEach(client => {
        if (client.connected) {
          // Simulate event emission
          const handlers = client.on.mock.calls.filter(([eventName]) => eventName === event);
          handlers.forEach(([, handler]) => handler(data));
        }
      });
    },
    
    getClient: (clientId) => clients.get(clientId),
    getAllClients: () => Array.from(clients.values()),
  };
};

// Component testing utilities
export const renderWithProviders = (component, providers = {}) => {
  const {
    AuthContext = { user: mockUser, token: 'mock-token' },
    ...otherProviders
  } = providers;
  
  // This would be implemented with your testing framework
  // For example, with React Testing Library:
  // return render(
  //   <AuthContext.Provider value={AuthContext}>
  //     {component}
  //   </AuthContext.Provider>,
  //   { wrapper: otherProviders }
  // );
  
  return component;
};

// Data generation utilities
export const generateMockMessages = (count, conversationId, sender = mockUser) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    content: `Message ${index + 1}`,
    sender,
    conversationId,
    createdAt: new Date(Date.now() - (count - index) * 60000).toISOString(),
    status: 'sent',
  }));
};

export const generateMockConversations = (count, currentUser = mockUser) => {
  return Array.from({ length: count }, (_, index) => ({
    id: index + 1,
    name: `Conversation ${index + 1}`,
    type: index % 2 === 0 ? 'direct' : 'group',
    participants: [currentUser, { id: index + 2, name: `User ${index + 2}` }],
    lastMessage: {
      id: index + 1,
      content: `Last message ${index + 1}`,
      sender: currentUser,
      createdAt: new Date(Date.now() - index * 3600000).toISOString(),
    },
    unreadCount: index % 3,
  }));
};

// Accessibility testing utilities
export const checkAccessibility = (container) => {
  const issues = [];
  
  // Check for alt text on images
  const images = container.querySelectorAll('img');
  images.forEach((img, index) => {
    if (!img.alt) {
      issues.push(`Image ${index + 1} missing alt text`);
    }
  });
  
  // Check for proper heading structure
  const headings = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
  
  for (let i = 1; i < headingLevels.length; i++) {
    if (headingLevels[i] - headingLevels[i - 1] > 1) {
      issues.push(`Heading level jump from h${headingLevels[i - 1]} to h${headingLevels[i]}`);
    }
  }
  
  // Check for form labels
  const inputs = container.querySelectorAll('input, textarea, select');
  inputs.forEach((input, index) => {
    const hasLabel = container.querySelector(`label[for="${input.id}"]`) || 
                    input.getAttribute('aria-label') || 
                    input.getAttribute('aria-labelledby');
    
    if (!hasLabel) {
      issues.push(`Input ${index + 1} missing label or aria-label`);
    }
  });
  
  return issues;
};

// Performance benchmark utilities
export const runPerformanceBenchmark = async (testName, testFunction, iterations = 10) => {
  const results = [];
  
  for (let i = 0; i < iterations; i++) {
    const memoryBefore = measureMemoryUsage();
    const start = performance.now();
    
    await testFunction();
    
    const end = performance.now();
    const memoryAfter = measureMemoryUsage();
    
    results.push({
      iteration: i + 1,
      duration: end - start,
      memoryDelta: memoryAfter ? memoryAfter.used - memoryBefore.used : 0,
    });
    
    // Allow garbage collection between iterations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  const durations = results.map(r => r.duration);
  const memoryDeltas = results.map(r => r.memoryDelta);
  
  return {
    testName,
    iterations,
    duration: {
      average: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      median: durations.sort((a, b) => a - b)[Math.floor(durations.length / 2)],
    },
    memory: {
      averageDelta: memoryDeltas.reduce((a, b) => a + b, 0) / memoryDeltas.length,
      totalDelta: memoryDeltas.reduce((a, b) => a + b, 0),
    },
    results,
  };
};

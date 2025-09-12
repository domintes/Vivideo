// Base Component Class - React-like component system for Vivideo
// This provides a foundation for creating React-like components in vanilla JS

class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.children = [];
    this.eventListeners = [];
    this.mounted = false;
  }

  // React-like setState method
  setState(newState, callback) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...newState };

    if (this.mounted) {
      this.update(prevState);
    }

    if (callback) {
      callback();
    }
  }

  // React-like render method - must be overridden by child components
  render() {
    throw new Error('Component must implement render() method');
  }

  // Mount component to DOM
  mount(parentElement) {
    if (this.mounted) {
      console.warn('Component already mounted');
      return;
    }

    const html = this.render();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    this.element = tempDiv.firstElementChild;

    if (parentElement) {
      parentElement.appendChild(this.element);
    }

    this.mounted = true;
    this.componentDidMount();
    this.attachEventListeners();
    return this.element;
  }

  // Unmount component from DOM
  unmount() {
    if (!this.mounted) {
      return;
    }

    this.componentWillUnmount();
    this.removeEventListeners();

    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }

    this.children.forEach((child) => {
      if (child.unmount) {
        child.unmount();
      }
    });

    this.mounted = false;
    this.element = null;
  }

  // Update component after state change
  update(prevState) {
    if (!this.mounted) {
      return;
    }

    const newHtml = this.render();
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = newHtml;
    const newElement = tempDiv.firstElementChild;

    if (this.element.parentNode) {
      this.element.parentNode.replaceChild(newElement, this.element);
      this.element = newElement;
      this.attachEventListeners();
    }

    this.componentDidUpdate(prevState);
  }

  // React-like lifecycle methods
  componentDidMount() {
    // Override in child components
  }

  componentDidUpdate(prevState) {
    // Override in child components
  }

  componentWillUnmount() {
    // Override in child components
  }

  // Event handling helpers
  addEventListener(selector, event, handler, options = {}) {
    const listener = {
      selector,
      event,
      handler,
      options,
      element: null
    };
    this.eventListeners.push(listener);

    if (this.mounted) {
      this.attachEventListener(listener);
    }
  }

  attachEventListener(listener) {
    if (!this.element) return;

    const element = listener.selector
      ? this.element.querySelector(listener.selector)
      : this.element;

    if (element) {
      listener.element = element;
      element.addEventListener(listener.event, listener.handler, listener.options);
    }
  }

  attachEventListeners() {
    this.eventListeners.forEach((listener) => {
      this.attachEventListener(listener);
    });
  }

  removeEventListeners() {
    this.eventListeners.forEach((listener) => {
      if (listener.element) {
        listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      }
    });
  }

  // Helper method to find elements within component
  querySelector(selector) {
    return this.element ? this.element.querySelector(selector) : null;
  }

  querySelectorAll(selector) {
    return this.element ? this.element.querySelectorAll(selector) : [];
  }

  // Child component management
  addChild(child) {
    this.children.push(child);
  }

  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index > -1) {
      this.children.splice(index, 1);
      if (child.unmount) {
        child.unmount();
      }
    }
  }

  // Utility method for creating HTML with proper escaping
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Utility method for conditional classes
  static classNames(...classes) {
    return classes.filter((cls) => cls).join(' ');
  }
}

// Export for use in other components
window.Component = Component;

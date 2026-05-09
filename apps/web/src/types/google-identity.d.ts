interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleAccountsId {
  initialize: (config: {
    client_id: string;
    callback: (response: GoogleCredentialResponse) => void;
    ux_mode?: 'popup' | 'redirect';
  }) => void;
  renderButton: (element: HTMLElement, options: {
    theme?: 'outline' | 'filled_blue' | 'filled_black';
    size?: 'small' | 'medium' | 'large';
    shape?: 'rectangular' | 'pill' | 'circle' | 'square';
    text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
    width?: string | number;
    logo_alignment?: 'left' | 'center';
  }) => void;
}

interface Window {
  google?: {
    accounts: {
      id: GoogleAccountsId;
    };
  };
}

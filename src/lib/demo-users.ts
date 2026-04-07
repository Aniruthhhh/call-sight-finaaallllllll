export const DEMO_USERS = {
  manager: {
    email: 'manager@callsight.com',
    password: 'manager12',
    full_name: 'Ram',
    role: 'manager'
  },
  executives: [
    {
      email: 'ex1@callsight.com',
      password: 'executive1',
      full_name: 'ex1',
      role: 'executive'
    },
    {
      email: 'ex2@callsight.com',
      password: 'executive2',
      full_name: 'ex2',
      role: 'executive'
    }
  ]
}

export const DEMO_EXECUTIVE_EMAILS = DEMO_USERS.executives.map(e => e.email)
